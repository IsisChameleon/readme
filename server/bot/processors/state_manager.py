"""BookReadingStateManager — function-call-driven state machine.

Replaces marker-based BookReaderProcessor with LLM function calls for
state transitions.  Sits between LLM and assistant aggregator in the pipeline.

Pipeline: STT -> user_agg -> LLM -> **StateManager** -> assistant_agg -> TTS -> output
"""

from __future__ import annotations

import enum

from loguru import logger
from pipecat.frames.frames import (
    BotStoppedSpeakingFrame,
    Frame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMMessagesAppendFrame,
    TTSSpeakFrame,
    UserStartedSpeakingFrame,
)
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

try:
    from ..library import Library
    from ..prompt import BOOK_SELECTION_SYSTEM, QA_SYSTEM, READING_SYSTEM
    from .frames import ResumeReadingFrame, StartReadingFrame
except ImportError:
    from library import Library  # type: ignore[assignment]
    from processors.frames import ResumeReadingFrame, StartReadingFrame  # type: ignore[assignment]
    from prompt import BOOK_SELECTION_SYSTEM, QA_SYSTEM, READING_SYSTEM  # type: ignore[assignment]


class State(enum.Enum):
    BOOK_SELECTION = "book_selection"
    READING = "reading"
    QA = "qa"


class BookReadingStateManager(FrameProcessor):
    """Function-call-driven state machine for book reading sessions."""

    def __init__(self, library: Library, context: LLMContext, **kwargs):
        super().__init__(**kwargs)
        self._library = library
        self._context = context
        self._state = State.BOOK_SELECTION
        self._reading_tts_active = False
        self._interrupted = False

    @property
    def state(self) -> State:
        return self._state

    # ------------------------------------------------------------------
    # Public entry point (called on client_ready)
    # ------------------------------------------------------------------

    async def enter_book_selection(self) -> None:
        """Set up book selection state with available books in the system prompt."""
        self._state = State.BOOK_SELECTION
        books = self._library.list_books()

        book_list = (
            "\n".join(f'- id={b.id}, title="{b.title}"' for b in books) or "No books available."
        )

        resume_hint = ""
        if self._library.book and self._library.current_chunk_index > 0:
            chunk = self._library.current_chunk()
            chapter = chunk.chapter_title if chunk else "the beginning"
            resume_hint = (
                f'\nThe child was previously reading "{self._library.book.title}" '
                f'and left off near "{chapter}".'
            )

        prompt = BOOK_SELECTION_SYSTEM.format(book_list=book_list, resume_hint=resume_hint)
        self._replace_system_prompt(prompt)

        await self.push_frame(
            LLMMessagesAppendFrame(
                messages=[
                    {
                        "role": "system",
                        "content": "Greet the child warmly and tell them which books are available.",
                    }
                ],
                run_llm=True,
            ),
            FrameDirection.UPSTREAM,
        )

    # ------------------------------------------------------------------
    # Frame processing
    # ------------------------------------------------------------------

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        if isinstance(frame, StartReadingFrame):
            logger.info(f"[StateManager] StartReading frame received: {frame}")
            await self._handle_start_reading(frame, direction)
            return

        if isinstance(frame, ResumeReadingFrame):
            logger.info(f"[StateManager] ResumeReading frame received: {frame}")
            await self._handle_resume_reading(frame, direction)
            return

        if isinstance(frame, UserStartedSpeakingFrame):
            logger.info(f"[StateManager] UserStartedSpeaking frame received: {frame}")
            await self._handle_user_interrupt(frame, direction)
            return

        if isinstance(frame, BotStoppedSpeakingFrame):
            logger.info(f"[StateManager] BotStoppedSpeaking frame received: {frame}")
            await self._handle_bot_stopped_speaking(frame, direction)
            return

        await self.push_frame(frame, direction)

    # ------------------------------------------------------------------
    # State transition handlers
    # ------------------------------------------------------------------

    async def _handle_start_reading(
        self, frame: StartReadingFrame, direction: FrameDirection
    ) -> None:
        if self._state != State.BOOK_SELECTION:
            logger.warning(f"start_reading ignored in state {self._state.value}")
            return

        if frame.chunk_index is not None:
            self._library.current_chunk_index = frame.chunk_index

        logger.info(f"BOOK_SELECTION -> READING at chunk {self._library.current_chunk_index}")
        self._state = State.READING
        self._interrupted = False
        self._replace_system_prompt(READING_SYSTEM)
        await self._push_current_chunk()

    async def _handle_resume_reading(
        self, frame: ResumeReadingFrame, direction: FrameDirection
    ) -> None:
        if self._state != State.QA:
            logger.warning(f"resume_reading ignored in state {self._state.value}")
            return

        logger.info(f"QA -> READING at chunk {self._library.current_chunk_index}")
        self._state = State.READING
        self._interrupted = False
        self._replace_system_prompt(READING_SYSTEM)
        await self._push_current_chunk()

    async def _handle_user_interrupt(
        self, frame: UserStartedSpeakingFrame, direction: FrameDirection
    ) -> None:
        if self._state == State.READING:
            logger.info("User interrupted during reading -> QA")
            self._state = State.QA
            self._reading_tts_active = False
            self._interrupted = True

            book = self._library.book
            chunk = self._library.current_chunk()
            if book and chunk:
                prompt = QA_SYSTEM.format(
                    title=book.title,
                    full_book_text=self._library.full_text(),
                    current_chunk_preview=chunk.text[:200],
                )
                self._replace_system_prompt(prompt)

        await self.push_frame(frame, direction)

    async def _handle_bot_stopped_speaking(
        self, frame: BotStoppedSpeakingFrame, direction: FrameDirection
    ) -> None:
        await self.push_frame(frame, direction)

        if self._interrupted:
            self._interrupted = False
            return

        if self._state == State.READING and self._reading_tts_active:
            self._reading_tts_active = False
            chunk = self._library.advance_chunk()
            if chunk:
                await self._push_current_chunk()
            else:
                logger.info("End of book reached")
                await self._assistant_says(
                    "That's the end of what we have so far! Great reading today."
                )
                await self.enter_book_selection()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _replace_system_prompt(self, prompt: str) -> None:
        system_msg = {"role": "system", "content": prompt}
        conversation = [
            m
            for m in self._context.get_messages()
            if not (isinstance(m, dict) and m.get("role") == "system")  # type: ignore[arg-type]
        ]
        self._context.set_messages([system_msg] + conversation)

    async def _push_current_chunk(self) -> None:
        chunk = self._library.current_chunk()
        if not chunk:
            await self._assistant_says(
                "That's the end of what we have so far! Great reading today."
            )
            await self.enter_book_selection()
            return

        logger.info(f"Reading chunk {chunk.chunk_index}: {chunk.text[:60]}...")
        self._reading_tts_active = True
        await self._assistant_says(chunk.text)

    async def _assistant_says(self, text: str) -> None:
        """Send text via TTS, wrapped so it gets recorded in conversation context."""
        await self.push_frame(LLMFullResponseStartFrame(), FrameDirection.DOWNSTREAM)
        await self.push_frame(TTSSpeakFrame(text=text), FrameDirection.DOWNSTREAM)
        await self.push_frame(LLMFullResponseEndFrame(), FrameDirection.DOWNSTREAM)
