"""BookReadingStateManager — function-call-driven state machine.

Replaces marker-based BookReaderProcessor with LLM function calls for
state transitions.  Sits between LLM and assistant aggregator in the pipeline.

Pipeline: STT -> user_agg -> LLM -> **StateManager** -> assistant_agg -> TTS -> output
"""

from __future__ import annotations

import asyncio
import enum
from collections.abc import Callable, Coroutine
from typing import Any

from loguru import logger
from pipecat.frames.frames import (
    BotStoppedSpeakingFrame,
    Frame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMMessagesAppendFrame,
    LLMUpdateSettingsFrame,
    TTSSpeakFrame,
    UserStartedSpeakingFrame,
)
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.services.llm_service import LLMService

try:
    from ..library import Library
    from ..prompt import FINISHED_SYSTEM, QA_SYSTEM, READING_SYSTEM
    from .frames import EndSessionFrame, StartReadingFrame
except ImportError:
    from library import Library  # type: ignore[assignment]
    from processors.frames import (  # type: ignore[assignment]
        EndSessionFrame,
        StartReadingFrame,
    )
    from prompt import (  # type: ignore[assignment]
        FINISHED_SYSTEM,
        QA_SYSTEM,
        READING_SYSTEM,
    )

IDLE_TIMEOUT_SECS = 60


class State(enum.Enum):
    BOOK_SELECTION = "book_selection"
    READING = "reading"
    QA = "qa"
    FINISHED = "finished"


class BookReadingStateManager(FrameProcessor):
    """Function-call-driven state machine for book reading sessions."""

    def __init__(self, library: Library, context: LLMContext, llm: LLMService, **kwargs):
        super().__init__(**kwargs)
        self._library = library
        self._context = context
        self._llm = llm
        self._state = State.BOOK_SELECTION
        self._reading_tts_active = False
        self._interrupted = False
        self._shutdown_pending = False
        self._disconnect_callback: Callable[[], Coroutine[Any, Any, None]] | None = None
        self._idle_task: asyncio.Task | None = None
        self._idle_event: asyncio.Event = asyncio.Event()
        self._book_index_map: dict[str, str] = {}

    # ------------------------------------------------------------------
    # Book index resolution
    # ------------------------------------------------------------------

    def populate_index(self, index: str, book_id: str) -> None:
        """Register a numeric index → full UUID mapping."""
        self._book_index_map[index] = book_id

    def resolve_book_id(self, raw_id: str) -> str:
        """Resolve a numeric index (e.g. '0') to a full UUID. Falls through to raw_id."""
        return self._book_index_map.get(raw_id, raw_id)

    @property
    def state(self) -> State:
        return self._state

    def set_disconnect_callback(self, callback: Callable[[], Coroutine[Any, Any, None]]) -> None:
        self._disconnect_callback = callback

    # ------------------------------------------------------------------
    # Public entry points
    # ------------------------------------------------------------------

    async def greet_child(self) -> None:
        """Push a greeting nudge. The system prompt is already set at context creation."""
        await self._stop_idle_timer()
        self._state = State.BOOK_SELECTION

        await self.push_frame(
            LLMMessagesAppendFrame(
                messages=[
                    {
                        "role": "system",
                        "content": "The child has joined. Greet them warmly.",
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

        if isinstance(frame, EndSessionFrame):
            logger.info(f"[StateManager] EndSession frame received: {frame}")
            await self._handle_end_session(frame, direction)
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
        if self._state not in (State.BOOK_SELECTION, State.QA, State.FINISHED):
            logger.warning(f"start_reading ignored in state {self._state.value}")
            return

        await self._stop_idle_timer()

        if frame.chunk_index is not None:
            self._library.current_chunk_index = frame.chunk_index

        logger.info(f"{self._state.value} -> READING at chunk {self._library.current_chunk_index}")
        self._state = State.READING
        self._interrupted = False
        await self._replace_system_prompt(READING_SYSTEM)
        await self._push_current_chunk()

    async def _handle_end_session(self, frame: EndSessionFrame, direction: FrameDirection) -> None:
        await self._stop_idle_timer()
        logger.info(f"{self._state.value} -> shutdown (reason={frame.reason})")
        self._shutdown_pending = True

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
                    chapter_map=self._format_chapter_map(),
                )
                await self._replace_system_prompt(prompt)

        elif self._state == State.FINISHED:
            self._idle_event.set()

        await self.push_frame(frame, direction)

    async def _handle_bot_stopped_speaking(
        self, frame: BotStoppedSpeakingFrame, direction: FrameDirection
    ) -> None:
        await self.push_frame(frame, direction)

        if self._shutdown_pending:
            self._shutdown_pending = False
            logger.info("Shutdown pending — sending disconnect signal")
            if self._disconnect_callback:
                await self._disconnect_callback()
            return

        if self._interrupted:
            self._interrupted = False
            return

        if self._state == State.READING and self._reading_tts_active:
            self._reading_tts_active = False
            chunk = self._library.advance_chunk()
            if chunk:
                await self._push_current_chunk()
            else:
                logger.info("End of book reached -> FINISHED")
                await self._enter_finished()

    # ------------------------------------------------------------------
    # FINISHED state
    # ------------------------------------------------------------------

    async def _enter_finished(self) -> None:
        self._state = State.FINISHED
        book = self._library.book
        books = self._library.list_books()

        if len(books) > 1:
            other_books = [b for b in books if not book or b.id != book.id]
            hints = []
            for i, b in enumerate(other_books, len(self._book_index_map)):
                idx = str(i)
                self._book_index_map[idx] = b.id
                hints.append(f'{idx}. "{b.title}"')
            another_book_hint = (
                "If they want a different book, call select_book(index) with one of:\n"
                + "\n".join(hints)
            )
        else:
            another_book_hint = (
                "If they ask for another book, let them know this was the only one "
                "available and suggest asking their parents to load more stories!"
            )

        # Find the index for the current book
        book_index = "1"
        if book:
            for idx, bid in self._book_index_map.items():
                if bid == book.id:
                    book_index = idx
                    break

        prompt = FINISHED_SYSTEM.format(
            title=book.title if book else "the book",
            full_book_text=self._library.full_text(),
            book_index=book_index,
            another_book_hint=another_book_hint,
        )
        await self._replace_system_prompt(prompt)

        await self.push_frame(
            LLMMessagesAppendFrame(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "The book is finished! Celebrate with the child and ask "
                            "about their favourite moment or character."
                        ),
                    }
                ],
                run_llm=True,
            ),
            FrameDirection.UPSTREAM,
        )

        self._start_idle_timer()

    # ------------------------------------------------------------------
    # Idle timer (Pipecat pattern: create_task + asyncio.Event + wait_for)
    # ------------------------------------------------------------------

    def _start_idle_timer(self) -> None:
        if self._idle_task:
            return
        self._idle_event.clear()
        try:
            self._idle_task = self.create_task(self._idle_task_handler(), name="idle_timer")
        except Exception:
            # Fallback when TaskManager isn't initialized (e.g. unit tests)
            self._idle_task = asyncio.create_task(self._idle_task_handler())

    async def _stop_idle_timer(self) -> None:
        if not self._idle_task:
            return
        try:
            await self.cancel_task(self._idle_task)
        except Exception:
            self._idle_task.cancel()
        self._idle_task = None
        self._idle_event.clear()

    async def _idle_task_handler(self) -> None:
        try:
            await asyncio.wait_for(self._idle_event.wait(), timeout=IDLE_TIMEOUT_SECS)
        except asyncio.TimeoutError:
            if self._state == State.FINISHED:
                logger.info(
                    f"Idle timeout ({IDLE_TIMEOUT_SECS}s) in FINISHED — initiating shutdown"
                )
                await self._assistant_says(
                    "It was lovely reading with you! Bye for now, see you next time!"
                )
                self._shutdown_pending = True
            return

        # User spoke — reset and loop
        self._idle_event.clear()
        self._idle_task = None
        self._start_idle_timer()

    async def cleanup(self) -> None:
        await self._stop_idle_timer()
        await super().cleanup()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _format_chapter_map(self) -> str:
        chapter_map = self._library.chapter_map
        if not chapter_map:
            return ""
        lines = [f'- "{title}" -> chunk_id={idx}' for title, idx in chapter_map.items()]
        return "\nChapter map:\n" + "\n".join(lines)

    async def _replace_system_prompt(self, prompt: str) -> None:
        # `Settings` lives on concrete LLMService subclasses (e.g. OpenAILLMService),
        # not on the base class — so the attribute is duck-typed here.
        await self.push_frame(
            LLMUpdateSettingsFrame(
                delta=self._llm.Settings(system_instruction=prompt),  # ty: ignore[unresolved-attribute]
            ),
            FrameDirection.UPSTREAM,
        )

    async def _push_current_chunk(self) -> None:
        chunk = self._library.current_chunk()
        if not chunk:
            logger.info("No chunk available -> FINISHED")
            await self._enter_finished()
            return

        logger.info(f"Reading chunk {chunk.chunk_index}: {chunk.text[:60]}...")
        self._reading_tts_active = True
        await self._assistant_says(chunk.text)

    async def _assistant_says(self, text: str) -> None:
        """Send text via TTS, wrapped so it gets recorded in conversation context."""
        await self.push_frame(LLMFullResponseStartFrame(), FrameDirection.DOWNSTREAM)
        await self.push_frame(TTSSpeakFrame(text=text), FrameDirection.DOWNSTREAM)
        await self.push_frame(LLMFullResponseEndFrame(), FrameDirection.DOWNSTREAM)
