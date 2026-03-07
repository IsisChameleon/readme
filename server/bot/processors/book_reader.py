"""BookReaderProcessor — sits between the LLM and the assistant aggregator.

Implements the CONFIRM → READING → QA state machine **and** detects
first-token intent markers (★/✓/○/◐) in the LLM's streamed response.

Pipeline position:  STT → user_agg → LLM → **BookReaderProcessor** → assistant_agg → TTS

* TranscriptionFrame is consumed by the user aggregator upstream — this
  processor never sees it.  Conversation history is managed by the
  LLMContext shared with the aggregator pair.
* LLMTextFrame is emitted downstream by the LLM and arrives here for
  marker detection.  Clean text (with markers stripped) is passed
  downstream to the assistant aggregator for context tracking.
* TTSSpeakFrame (reading chunks) is pushed downstream straight to TTS.
"""

from __future__ import annotations

import asyncio
import enum

from loguru import logger
from pipecat.frames.frames import (
    Frame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMMessagesAppendFrame,
    LLMTextFrame,
    TTSSpeakFrame,
    TTSStoppedFrame,
    UserStartedSpeakingFrame,
)
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

try:
    from ..prompt import (
        INTENT_INSTRUCTIONS_CONFIRM,
        INTENT_INSTRUCTIONS_QA,
        READING_COMPANION_SYSTEM,
    )
    from ..supabase_client import (
        get_book_chunks,
        get_book_metadata,
        get_reading_progress,
        save_reading_progress,
    )
except ImportError:
    from prompt import (  # type: ignore[assignment]
        INTENT_INSTRUCTIONS_CONFIRM,
        INTENT_INSTRUCTIONS_QA,
        READING_COMPANION_SYSTEM,
    )
    from supabase_client import (  # type: ignore[assignment]
        get_book_chunks,
        get_book_metadata,
        get_reading_progress,
        save_reading_progress,
    )

# Intent markers emitted by the LLM as the first token of its response.
INTENT_AFFIRM = "★"
INTENT_ANSWER = "✓"
INTENT_WAIT_SHORT = "○"
INTENT_WAIT_LONG = "◐"

_MARKERS = {
    INTENT_AFFIRM: "affirm",
    INTENT_ANSWER: "answer",
    INTENT_WAIT_SHORT: "wait_short",
    INTENT_WAIT_LONG: "wait_long",
}

WAIT_SHORT_TIMEOUT = 5.0
WAIT_LONG_TIMEOUT = 10.0

_MARKER_BUFFER_LIMIT = 20


class State(enum.Enum):
    SELECTING_BOOK = "selecting_book"
    READING = "reading"
    QA = "qa"


class BookReaderProcessor(FrameProcessor):
    """Pipecat FrameProcessor implementing CONFIRM → READING → QA state machine.

    Sits **between** the LLM and the assistant aggregator so it can intercept
    ``LLMTextFrame`` for marker detection before the assistant aggregator
    consumes them.  Conversation history is managed by the shared ``LLMContext``.
    """

    def __init__(self, kid_id: str, context: LLMContext, **kwargs):
        super().__init__(**kwargs)
        self._kid_id = kid_id
        self._context = context

        # State
        self._state = State.SELECTING_BOOK
        self._reading_tts_active = False
        self._interrupted = False
        self._wait_task: asyncio.Task | None = None

        # Book data
        self._book_id: str | None = None
        self._chunks: list[dict] = []
        self._current_chunk_index = 0
        self._book_title = ""
        self._full_book_text = ""
        self._chunks_read: list[int] = []

        # Marker detection state (reset per LLM response)
        self._marker_buffer = ""
        self._marker_resolved = False
        self._marker_suppressed = False

    # ------------------------------------------------------------------
    # Book initialisation (can be called more than once to switch books)
    # ------------------------------------------------------------------

    async def _assistant_says(self, text: str) -> None:
        await self.push_frame(LLMFullResponseStartFrame(), FrameDirection.DOWNSTREAM)
        await self.push_frame(TTSSpeakFrame(text), FrameDirection.DOWNSTREAM)
        await self.push_frame(LLMFullResponseEndFrame(), FrameDirection.DOWNSTREAM)

    async def initialize_book(self, book_id: str) -> None:
        """Load book data from Supabase and prompt the LLM to greet the user."""
        self._book_id = book_id
        self._chunks_read = []

        meta = get_book_metadata(book_id)
        if not meta:
            logger.error(f"Book not found: {book_id}")
            await self._assistant_says("Sorry, I couldn't find that book.")
            return

        self._book_title = meta["title"]
        self._chunks = get_book_chunks(book_id)
        self._current_chunk_index = get_reading_progress(book_id, self._kid_id)

        if not self._chunks:
            logger.error(f"No chunks for book: {book_id}")
            await self._assistant_says("Sorry, this book has no content yet.")
            return

        if self._current_chunk_index >= len(self._chunks):
            self._current_chunk_index = 0

        self._full_book_text = "\n\n".join(c["text"] for c in self._chunks)

        logger.info(
            f"Book loaded: {self._book_title}, {len(self._chunks)} chunks, "
            f"resuming at {self._current_chunk_index}"
        )
        self._state = State.SELECTING_BOOK
        self._replace_system_prompt()

        chapter_hint = self._chunks[self._current_chunk_index].get("chapter_title", "the beginning")
        if self._current_chunk_index == 0:
            book_context = (
                f'Book "{self._book_title}" is loaded and ready. '
                f"This is a fresh start — greet the child and ask if they'd like to start reading."
            )
        else:
            book_context = (
                f'Book "{self._book_title}" is loaded. '
                f"The user left off at chunk {self._current_chunk_index + 1}/{len(self._chunks)} "
                f'near "{chapter_hint}". '
                f"Greet the child, mention where they left off, and ask if they'd like to continue."
            )

        await self.push_frame(
            LLMMessagesAppendFrame(
                messages=[{"role": "system", "content": book_context}],
                run_llm=True,
            ),
            FrameDirection.UPSTREAM,
        )

    # ------------------------------------------------------------------
    # System prompt management (updates the shared LLMContext)
    # ------------------------------------------------------------------

    def get_system_prompt(self) -> str:
        """Return the system prompt string for the current state (pure, no side effects)."""
        if self._state == State.SELECTING_BOOK:
            return (
                f"You are a friendly reading companion. "
                f'The book is "{self._book_title}".\n\n' + INTENT_INSTRUCTIONS_CONFIRM
            )

        current_preview = ""
        if self._current_chunk_index < len(self._chunks):
            current_preview = self._chunks[self._current_chunk_index]["text"][:200]

        return (
            READING_COMPANION_SYSTEM.format(
                title=self._book_title,
                full_book_text=self._full_book_text,
                current_chunk_preview=current_preview,
            )
            + "\n\n"
            + INTENT_INSTRUCTIONS_QA
        )

    def _replace_system_prompt(self) -> None:
        """Replace the system message in the shared LLMContext, preserving history."""
        system_msg = {"role": "system", "content": self.get_system_prompt()}
        conversation = [
            m
            for m in self._context.get_messages()
            if not (isinstance(m, dict) and m.get("role") == "system")  # type: ignore[arg-type]
        ]
        self._context.set_messages([system_msg] + conversation)

    # ------------------------------------------------------------------
    # Reading logic
    # ------------------------------------------------------------------

    async def _push_current_chunk(self, transition: str = "") -> None:
        """Push the current chunk as a TTSSpeakFrame."""
        if self._current_chunk_index >= len(self._chunks):
            await self.push_frame(
                TTSSpeakFrame(text="That's the end of what we have so far! Great reading today.")
            )
            self._state = State.SELECTING_BOOK
            self._replace_system_prompt()
            return

        chunk = self._chunks[self._current_chunk_index]
        text = f"{transition}{chunk['text']}" if transition else chunk["text"]
        logger.info(f"Reading chunk {self._current_chunk_index}: {chunk['text'][:60]}...")
        self._reading_tts_active = True
        await self.push_frame(TTSSpeakFrame(text=text))

    async def _advance_to_next_chunk(self) -> None:
        """Move to the next chunk and push it."""
        self._chunks_read.append(self._current_chunk_index)
        self._current_chunk_index += 1
        await self._push_current_chunk()

    # ------------------------------------------------------------------
    # Wait / re-prompt
    # ------------------------------------------------------------------

    def _cancel_wait(self) -> None:
        if self._wait_task and not self._wait_task.done():
            self._wait_task.cancel()
        self._wait_task = None

    async def _start_wait(self, wait_type: str) -> None:
        self._cancel_wait()
        timeout = WAIT_SHORT_TIMEOUT if wait_type == "short" else WAIT_LONG_TIMEOUT
        logger.info(f"[{self._state.value}] Wait intent ({wait_type}), timeout={timeout}s")
        self._wait_task = asyncio.create_task(self._wait_and_reprompt(timeout))

    async def _wait_and_reprompt(self, timeout: float) -> None:
        try:
            await asyncio.sleep(timeout)
            if self._state == State.SELECTING_BOOK:
                nudge = (
                    "The child hasn't responded. Gently ask if they'd like you to start reading."
                )
            else:
                nudge = (
                    "The child has been quiet. "
                    "Kindly check if they have a question or would like to continue."
                )
            await self.push_frame(
                LLMMessagesAppendFrame(
                    messages=[{"role": "system", "content": nudge}],
                    run_llm=True,
                ),
                FrameDirection.UPSTREAM,
            )
        except asyncio.CancelledError:
            pass

    # ------------------------------------------------------------------
    # Frame processing
    # ------------------------------------------------------------------

    async def process_frame(self, frame: Frame, direction: FrameDirection) -> None:
        await super().process_frame(frame, direction)

        # --- Marker detection (LLM response) ---
        if isinstance(frame, LLMFullResponseEndFrame):
            await self._marker_flush_and_reset()
            await self.push_frame(frame, direction)
            return

        if isinstance(frame, LLMTextFrame):
            await self._handle_llm_text(frame, direction)
            return

        # --- State machine inputs ---
        if isinstance(frame, UserStartedSpeakingFrame):
            await self._handle_user_started_speaking(frame)
            return

        if isinstance(frame, TTSStoppedFrame):
            await self._handle_tts_stopped(frame)
            return

        # Everything else passes through
        await self.push_frame(frame, direction)

    # ------------------------------------------------------------------
    # Handlers
    # ------------------------------------------------------------------

    async def _handle_user_started_speaking(self, frame: Frame) -> None:
        self._cancel_wait()
        if self._state == State.READING:
            logger.info("User interrupted during reading — switching to QA")
            self._state = State.QA
            self._reading_tts_active = False
            self._interrupted = True
            self._replace_system_prompt()
        await self.push_frame(frame)

    async def _handle_tts_stopped(self, frame: TTSStoppedFrame) -> None:
        await self.push_frame(frame)

        if self._interrupted:
            self._interrupted = False
            return

        if self._state == State.READING and self._reading_tts_active:
            self._reading_tts_active = False
            await self._advance_to_next_chunk()

    # ------------------------------------------------------------------
    # Marker detection  (was ReadingIntentProcessor)
    # ------------------------------------------------------------------

    async def _handle_llm_text(self, frame: LLMTextFrame, direction: FrameDirection) -> None:
        if self._marker_suppressed:
            return

        if self._marker_resolved:
            await self.push_frame(frame, direction)
            return

        self._marker_buffer += frame.text
        await self._try_detect_marker()

    async def _try_detect_marker(self) -> None:
        for marker, intent in _MARKERS.items():
            if marker not in self._marker_buffer:
                continue

            self._marker_resolved = True

            if intent == "affirm":
                self._marker_suppressed = True
                self._cancel_wait()
                self._interrupted = False
                logger.info(f"[{self._state.value}] Affirm intent — starting reading")
                was_qa = self._state == State.QA
                self._state = State.READING
                self._replace_system_prompt()
                transition = "OK, back to the story. " if was_qa else ""
                await self._push_current_chunk(transition=transition)
                return

            if intent == "answer":
                idx = self._marker_buffer.index(marker) + len(marker)
                remaining = self._marker_buffer[idx:]
                if remaining.startswith(" "):
                    remaining = remaining[1:]
                if remaining:
                    await self.push_frame(LLMTextFrame(text=remaining))
                self._marker_buffer = ""
                return

            # wait_short / wait_long
            self._marker_suppressed = True
            wait_type = "short" if intent == "wait_short" else "long"
            await self._start_wait(wait_type)
            return

        # Graceful degradation: no marker found after enough text
        if len(self._marker_buffer) > _MARKER_BUFFER_LIMIT:
            logger.warning("No intent marker found in LLM response, passing through")
            self._marker_resolved = True
            await self.push_frame(LLMTextFrame(text=self._marker_buffer))
            self._marker_buffer = ""

    async def _marker_flush_and_reset(self) -> None:
        """Push any un-resolved buffer at end-of-response, then reset."""
        if not self._marker_resolved and self._marker_buffer:
            logger.warning("No intent marker found at end of LLM response, flushing buffer")
            await self.push_frame(LLMTextFrame(text=self._marker_buffer))
        self._marker_buffer = ""
        self._marker_resolved = False
        self._marker_suppressed = False

    # ------------------------------------------------------------------
    # Progress persistence
    # ------------------------------------------------------------------

    def save_progress(self) -> None:
        """Save current reading position to Supabase. Call on disconnect."""
        if not self._chunks or not self._book_id:
            return
        try:
            save_reading_progress(self._book_id, self._kid_id, self._current_chunk_index)
        except Exception:
            logger.exception("Failed to save reading progress")
