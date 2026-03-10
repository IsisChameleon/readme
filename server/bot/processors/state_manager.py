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
    TTSSpeakFrame,
    UserStartedSpeakingFrame,
)
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

try:
    from ..library import Library
    from ..prompt import BOOK_SELECTION_SYSTEM, FINISHED_SYSTEM, QA_SYSTEM, READING_SYSTEM
    from .frames import EndSessionFrame, StartReadingFrame
except ImportError:
    from library import Library  # type: ignore[assignment]
    from processors.frames import (  # type: ignore[assignment]
        EndSessionFrame,
        StartReadingFrame,
    )
    from prompt import (  # type: ignore[assignment]
        BOOK_SELECTION_SYSTEM,
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

    def __init__(self, library: Library, context: LLMContext, **kwargs):
        super().__init__(**kwargs)
        self._library = library
        self._context = context
        self._state = State.BOOK_SELECTION
        self._reading_tts_active = False
        self._interrupted = False
        self._shutdown_pending = False
        self._disconnect_callback: Callable[[], Coroutine[Any, Any, None]] | None = None
        self._idle_task: asyncio.Task | None = None
        self._idle_event: asyncio.Event = asyncio.Event()

    @property
    def state(self) -> State:
        return self._state

    def set_disconnect_callback(self, callback: Callable[[], Coroutine[Any, Any, None]]) -> None:
        self._disconnect_callback = callback

    # ------------------------------------------------------------------
    # Public entry points
    # ------------------------------------------------------------------

    async def enter_book_selection(self) -> None:
        """Set up book selection state with available books in the system prompt."""
        await self._stop_idle_timer()
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

        chapter_map = self._format_chapter_map()
        prompt = BOOK_SELECTION_SYSTEM.format(
            book_list=book_list, resume_hint=resume_hint, chapter_map=chapter_map
        )
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
        self._replace_system_prompt(READING_SYSTEM)
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
                self._replace_system_prompt(prompt)

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
            book_list = ", ".join(f'{b.id} ("{b.title}")' for b in other_books)
            another_book_hint = (
                f"If they want a different book, call select_book(book_id) with one of: {book_list}"
            )
        else:
            another_book_hint = (
                "If they ask for another book, let them know this was the only one "
                "available and suggest asking their parents to load more stories!"
            )

        prompt = FINISHED_SYSTEM.format(
            title=book.title if book else "the book",
            full_book_text=self._library.full_text(),
            book_id=book.id if book else "",
            another_book_hint=another_book_hint,
        )
        self._replace_system_prompt(prompt)

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
