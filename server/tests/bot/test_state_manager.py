"""Unit tests for the BookReadingStateManager."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from pipecat.frames.frames import (
    BotStoppedSpeakingFrame,
    Frame,
    LLMFullResponseEndFrame,
    LLMFullResponseStartFrame,
    LLMMessagesAppendFrame,
    LLMTextFrame,
    TTSSpeakFrame,
    UserStartedSpeakingFrame,
)
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.frame_processor import FrameDirection

from bot.library import Library
from bot.processors.frames import ResumeReadingFrame, StartReadingFrame
from bot.processors.state_manager import BookReadingStateManager, State

FAKE_BOOKS = [
    {"id": "book_001", "title": "The Rabbit", "status": "ready"},
    {"id": "book_002", "title": "The Fox", "status": "ready"},
]

FAKE_META = {"id": "book_001", "title": "The Rabbit", "status": "ready"}

FAKE_CHUNKS = [
    {
        "chunk_index": 0,
        "chapter_title": "Chapter I",
        "page_start": 1,
        "page_end": 1,
        "text": "Once upon a time.",
    },
    {
        "chunk_index": 1,
        "chapter_title": "Chapter I",
        "page_start": 2,
        "page_end": 2,
        "text": "There was a rabbit.",
    },
    {
        "chunk_index": 2,
        "chapter_title": "Chapter II",
        "page_start": 3,
        "page_end": 3,
        "text": "The end.",
    },
]


def _patch_supabase(progress: int = 0):
    return patch.multiple(
        "bot.library",
        list_books=MagicMock(return_value=FAKE_BOOKS),
        get_book_metadata=MagicMock(return_value=FAKE_META),
        get_book_chunks=MagicMock(return_value=FAKE_CHUNKS),
        get_reading_progress=MagicMock(return_value=progress),
        save_reading_progress=MagicMock(),
    )


class _FrameCollector:
    def __init__(self):
        self.frames: list[tuple[Frame, FrameDirection]] = []

    async def __call__(self, frame: Frame, direction: FrameDirection = FrameDirection.DOWNSTREAM):
        self.frames.append((frame, direction))

    def _frames_of(self, cls):
        return [f for f, _ in self.frames if isinstance(f, cls)]

    def tts_texts(self) -> list[str]:
        return [f.text for f in self._frames_of(TTSSpeakFrame)]

    def clear(self):
        self.frames.clear()


def _make_state_manager(
    progress: int = 0,
) -> tuple[BookReadingStateManager, Library, _FrameCollector]:
    context = LLMContext()
    library = Library(kid_id="test_kid")
    sm = BookReadingStateManager(library=library, context=context)
    collector = _FrameCollector()
    sm.push_frame = collector
    with _patch_supabase(progress=progress):
        library.initialize_book("book_001")
    return sm, library, collector


# ======================================================================
# Book selection
# ======================================================================


@pytest.mark.asyncio
async def test_enter_book_selection_sets_state():
    sm, library, collector = _make_state_manager()
    with _patch_supabase():
        await sm.enter_book_selection()
    assert sm.state == State.BOOK_SELECTION


@pytest.mark.asyncio
async def test_enter_book_selection_triggers_llm_greeting():
    sm, library, collector = _make_state_manager()
    with _patch_supabase():
        await sm.enter_book_selection()
    appends = [(f, d) for f, d in collector.frames if isinstance(f, LLMMessagesAppendFrame)]
    assert len(appends) == 1
    frame, direction = appends[0]
    assert direction == FrameDirection.UPSTREAM
    assert frame.run_llm is True


@pytest.mark.asyncio
async def test_enter_book_selection_sets_system_prompt():
    sm, library, collector = _make_state_manager()
    with _patch_supabase():
        await sm.enter_book_selection()
    messages = sm._context.get_messages()
    assert messages[0]["role"] == "system"
    assert "book_001" in messages[0]["content"]


# ======================================================================
# Start reading
# ======================================================================


@pytest.mark.asyncio
async def test_start_reading_transitions_to_reading():
    sm, library, collector = _make_state_manager()
    sm._state = State.BOOK_SELECTION

    await sm.process_frame(
        StartReadingFrame(book_id="book_001", chunk_index=0),
        FrameDirection.DOWNSTREAM,
    )

    assert sm.state == State.READING
    texts = collector.tts_texts()
    assert len(texts) == 1
    assert "Once upon a time." in texts[0]


@pytest.mark.asyncio
async def test_start_reading_respects_chunk_index():
    sm, library, collector = _make_state_manager()
    sm._state = State.BOOK_SELECTION

    await sm.process_frame(
        StartReadingFrame(book_id="book_001", chunk_index=1),
        FrameDirection.DOWNSTREAM,
    )

    assert library.current_chunk_index == 1
    texts = collector.tts_texts()
    assert "There was a rabbit." in texts[0]


@pytest.mark.asyncio
async def test_start_reading_ignored_outside_book_selection():
    sm, library, collector = _make_state_manager()
    sm._state = State.QA

    await sm.process_frame(
        StartReadingFrame(book_id="book_001"),
        FrameDirection.DOWNSTREAM,
    )

    assert sm.state == State.QA
    assert collector.tts_texts() == []


# ======================================================================
# User interruption
# ======================================================================


@pytest.mark.asyncio
async def test_user_interrupt_switches_to_qa():
    sm, library, collector = _make_state_manager()
    sm._state = State.READING

    await sm.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)

    assert sm.state == State.QA
    assert sm._interrupted is True


@pytest.mark.asyncio
async def test_user_interrupt_updates_system_prompt():
    sm, library, collector = _make_state_manager()
    sm._state = State.READING

    await sm.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)

    messages = sm._context.get_messages()
    assert (
        "interrupted" in messages[0]["content"].lower()
        or "question" in messages[0]["content"].lower()
    )


@pytest.mark.asyncio
async def test_user_interrupt_outside_reading_passes_through():
    sm, library, collector = _make_state_manager()
    sm._state = State.BOOK_SELECTION

    await sm.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)

    assert sm.state == State.BOOK_SELECTION
    # Frame should still pass through
    assert any(isinstance(f, UserStartedSpeakingFrame) for f, _ in collector.frames)


# ======================================================================
# Resume reading
# ======================================================================


@pytest.mark.asyncio
async def test_resume_reading_transitions_from_qa():
    sm, library, collector = _make_state_manager()
    sm._state = State.QA

    await sm.process_frame(
        ResumeReadingFrame(book_id="book_001"),
        FrameDirection.DOWNSTREAM,
    )

    assert sm.state == State.READING
    texts = collector.tts_texts()
    assert len(texts) == 1
    assert "Once upon a time." in texts[0]


@pytest.mark.asyncio
async def test_resume_reading_ignored_outside_qa():
    sm, library, collector = _make_state_manager()
    sm._state = State.BOOK_SELECTION

    await sm.process_frame(
        ResumeReadingFrame(book_id="book_001"),
        FrameDirection.DOWNSTREAM,
    )

    assert sm.state == State.BOOK_SELECTION
    assert collector.tts_texts() == []


# ======================================================================
# TTS stopped (auto-advance)
# ======================================================================


@pytest.mark.asyncio
async def test_tts_stopped_advances_chunk():
    sm, library, collector = _make_state_manager()
    sm._state = State.READING
    sm._reading_tts_active = True

    await sm.process_frame(BotStoppedSpeakingFrame(), FrameDirection.DOWNSTREAM)

    assert library.current_chunk_index == 1
    texts = collector.tts_texts()
    assert "There was a rabbit." in texts


@pytest.mark.asyncio
async def test_tts_stopped_after_interrupt_does_not_advance():
    sm, library, collector = _make_state_manager()
    sm._state = State.READING
    sm._reading_tts_active = True

    # Interrupt
    await sm.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)
    assert sm._interrupted is True
    collector.clear()

    # TTS stopped arrives after interrupt
    await sm.process_frame(BotStoppedSpeakingFrame(), FrameDirection.DOWNSTREAM)

    assert library.current_chunk_index == 0
    assert sm._interrupted is False


@pytest.mark.asyncio
async def test_tts_stopped_passes_frame_upstream():
    sm, library, collector = _make_state_manager()
    sm._state = State.BOOK_SELECTION

    await sm.process_frame(BotStoppedSpeakingFrame(), FrameDirection.UPSTREAM)

    bot_stopped = [(f, d) for f, d in collector.frames if isinstance(f, BotStoppedSpeakingFrame)]
    assert len(bot_stopped) == 1
    assert bot_stopped[0][1] == FrameDirection.UPSTREAM


@pytest.mark.asyncio
async def test_end_of_book_returns_to_selection():
    sm, library, collector = _make_state_manager(progress=2)
    sm._state = State.READING
    sm._reading_tts_active = True

    with _patch_supabase():
        await sm.process_frame(BotStoppedSpeakingFrame(), FrameDirection.DOWNSTREAM)

    texts = collector.tts_texts()
    assert any("end" in t.lower() for t in texts)
    assert sm.state == State.BOOK_SELECTION


# ======================================================================
# Pass-through
# ======================================================================


@pytest.mark.asyncio
async def test_llm_text_passes_through():
    sm, library, collector = _make_state_manager()

    frame = LLMTextFrame(text="Hello there!")
    await sm.process_frame(frame, FrameDirection.DOWNSTREAM)

    assert any(f is frame for f, _ in collector.frames)


@pytest.mark.asyncio
async def test_non_handled_frames_pass_through():
    sm, library, collector = _make_state_manager()

    frame = TTSSpeakFrame(text="test")
    await sm.process_frame(frame, FrameDirection.DOWNSTREAM)

    assert any(f is frame for f, _ in collector.frames)
