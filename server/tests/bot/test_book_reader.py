"""Unit tests for the unified BookReaderProcessor.

Tests cover the state machine (CONFIRM/READING/QA), LLM intent-marker
detection (★/✓/○/◐), system prompt management via shared LLMContext,
and the interruption guard.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from pipecat.frames.frames import (
    Frame,
    LLMFullResponseEndFrame,
    LLMMessagesAppendFrame,
    LLMTextFrame,
    TTSSpeakFrame,
    TTSStoppedFrame,
    UserStartedSpeakingFrame,
)
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.frame_processor import FrameDirection  # noqa: I001

from bot.processors.book_reader import (
    INTENT_AFFIRM,
    INTENT_ANSWER,
    INTENT_WAIT_LONG,
    INTENT_WAIT_SHORT,
    BookReaderProcessor,
    State,
)

FAKE_CHUNKS = [
    {
        "chunk_index": 0,
        "chapter_title": "Chapter I",
        "text": "Once upon a time.",
    },
    {
        "chunk_index": 1,
        "chapter_title": "Chapter I",
        "text": "There was a rabbit.",
    },
    {
        "chunk_index": 2,
        "chapter_title": "Chapter II",
        "text": "The end.",
    },
]

FAKE_META = {"id": "book_demo_001", "title": "Test Book", "status": "ready"}


class _FrameCollector:
    """Captures frames pushed by the processor, recording direction."""

    def __init__(self):
        self.frames: list[tuple[Frame, FrameDirection]] = []

    async def __call__(self, frame: Frame, direction: FrameDirection = FrameDirection.DOWNSTREAM):
        self.frames.append((frame, direction))

    def _frames_of(self, cls):
        return [f for f, _ in self.frames if isinstance(f, cls)]

    def tts_texts(self) -> list[str]:
        return [f.text for f in self._frames_of(TTSSpeakFrame)]

    def llm_text_frames(self) -> list[LLMTextFrame]:
        return self._frames_of(LLMTextFrame)

    def llm_messages_append_frames(self) -> list[tuple[LLMMessagesAppendFrame, FrameDirection]]:
        return [(f, d) for f, d in self.frames if isinstance(f, LLMMessagesAppendFrame)]

    def clear(self):
        self.frames.clear()


def _make_processor() -> BookReaderProcessor:
    context = LLMContext()
    return BookReaderProcessor(kid_id="test_kid", context=context)


@pytest.fixture
def processor():
    return _make_processor()


@pytest.fixture
def collector():
    return _FrameCollector()


def _patch_supabase(progress: int = 0):
    """Return a context manager that patches all Supabase calls."""
    return patch.multiple(
        "bot.processors.book_reader",
        get_book_metadata=MagicMock(return_value=FAKE_META),
        get_book_chunks=MagicMock(return_value=FAKE_CHUNKS),
        get_reading_progress=MagicMock(return_value=progress),
        save_reading_progress=MagicMock(),
    )


# ======================================================================
# Initialisation
# ======================================================================


@pytest.mark.asyncio
async def test_initialize_book_pushes_greeting(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    appends = collector.llm_messages_append_frames()
    assert len(appends) == 1
    frame, direction = appends[0]
    assert direction == FrameDirection.UPSTREAM
    assert frame.run_llm is True
    assert "Test Book" in frame.messages[0]["content"]
    assert processor._state == State.SELECTING_BOOK


@pytest.mark.asyncio
async def test_initialize_book_with_progress_mentions_chapter(processor, collector):
    processor.push_frame = collector

    with _patch_supabase(progress=2):
        await processor.initialize_book("book_demo_001")

    appends = collector.llm_messages_append_frames()
    assert len(appends) == 1
    assert "Chapter II" in appends[0][0].messages[0]["content"]


@pytest.mark.asyncio
async def test_initialize_book_stores_book_id(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    assert processor._book_id == "book_demo_001"


@pytest.mark.asyncio
async def test_initialize_book_sets_system_prompt(processor, collector):
    """System prompt in shared LLMContext should be set on init."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    messages = processor._context.get_messages()
    assert len(messages) >= 1
    assert messages[0]["role"] == "system"
    assert "Test Book" in messages[0]["content"]


@pytest.mark.asyncio
async def test_initialize_book_clears_chunks_read(processor, collector):
    processor.push_frame = collector
    processor._chunks_read = [0, 1, 2]

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    assert processor._chunks_read == []


# ======================================================================
# System prompt updates on state change
# ======================================================================


@pytest.mark.asyncio
async def test_system_prompt_updates_on_qa_transition(processor, collector):
    """When user interrupts reading, system prompt should switch to QA mode."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    processor._state = State.READING

    await processor.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)

    assert processor._state == State.QA
    messages = processor._context.get_messages()
    assert "EXPLICITLY asks to resume" in messages[0]["content"]


@pytest.mark.asyncio
async def test_system_prompt_updates_on_affirm(processor, collector):
    """When affirm marker detected, system prompt should update for reading state."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    processor._state = State.QA
    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_AFFIRM} Let's go!"),
        FrameDirection.DOWNSTREAM,
    )

    assert processor._state == State.READING


# ======================================================================
# Marker detection in LLMTextFrame
# ======================================================================


@pytest.mark.asyncio
async def test_affirm_marker_starts_reading(processor, collector):
    """★ marker should suppress text, transition to READING, push chunk."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_AFFIRM} Great, let's go!"),
        FrameDirection.DOWNSTREAM,
    )

    assert processor._state == State.READING
    texts = collector.tts_texts()
    assert len(texts) == 1
    assert "Once upon a time." in texts[0]
    assert len(collector.llm_text_frames()) == 0  # LLM text suppressed


@pytest.mark.asyncio
async def test_affirm_from_qa_includes_transition(processor, collector):
    """★ marker from QA state should prepend transition text."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    processor._state = State.QA
    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_AFFIRM} Let's go!"),
        FrameDirection.DOWNSTREAM,
    )

    assert processor._state == State.READING
    texts = collector.tts_texts()
    assert len(texts) == 1
    assert texts[0].startswith("OK, back to the story.")


@pytest.mark.asyncio
async def test_affirm_from_confirm_no_transition(processor, collector):
    """★ marker from CONFIRM state should NOT have transition text."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    assert processor._state == State.SELECTING_BOOK
    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_AFFIRM} Great, let's go!"),
        FrameDirection.DOWNSTREAM,
    )

    texts = collector.tts_texts()
    assert len(texts) == 1
    assert texts[0] == "Once upon a time."


@pytest.mark.asyncio
async def test_affirm_marker_suppresses_subsequent_text(processor, collector):
    """After ★, all remaining LLMTextFrames in the response are dropped."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_AFFIRM} Let's"),
        FrameDirection.DOWNSTREAM,
    )
    await processor.process_frame(
        LLMTextFrame(text=" keep going!"),
        FrameDirection.DOWNSTREAM,
    )

    assert len(collector.llm_text_frames()) == 0


@pytest.mark.asyncio
async def test_answer_marker_strips_and_passes_text(processor, collector):
    """✓ marker should be stripped; the answer text passes through to TTS."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_ANSWER} The rabbit is the hero!"),
        FrameDirection.DOWNSTREAM,
    )

    texts = collector.llm_text_frames()
    assert len(texts) == 1
    assert texts[0].text == "The rabbit is the hero!"


@pytest.mark.asyncio
async def test_answer_marker_subsequent_chunks_pass_through(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_ANSWER} Start"),
        FrameDirection.DOWNSTREAM,
    )
    await processor.process_frame(
        LLMTextFrame(text=" of the answer."),
        FrameDirection.DOWNSTREAM,
    )

    texts = collector.llm_text_frames()
    assert len(texts) == 2
    assert texts[1].text == " of the answer."


@pytest.mark.asyncio
async def test_wait_short_marker_suppresses(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=INTENT_WAIT_SHORT),
        FrameDirection.DOWNSTREAM,
    )

    assert len(collector.llm_text_frames()) == 0
    assert processor._wait_task is not None
    processor._cancel_wait()


@pytest.mark.asyncio
async def test_wait_long_marker_suppresses(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    await processor.process_frame(
        LLMTextFrame(text=INTENT_WAIT_LONG),
        FrameDirection.DOWNSTREAM,
    )

    assert len(collector.llm_text_frames()) == 0
    assert processor._wait_task is not None
    processor._cancel_wait()


@pytest.mark.asyncio
async def test_no_marker_graceful_fallthrough(processor, collector):
    """When no marker is found after buffer limit, text passes through."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    long_text = "This is a long response without any marker at all."
    await processor.process_frame(
        LLMTextFrame(text=long_text),
        FrameDirection.DOWNSTREAM,
    )

    texts = collector.llm_text_frames()
    assert len(texts) == 1
    assert texts[0].text == long_text


@pytest.mark.asyncio
async def test_marker_resets_on_response_end(processor, collector):
    """Marker state resets after LLMFullResponseEndFrame."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    # First response — affirm
    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_AFFIRM} Go!"),
        FrameDirection.DOWNSTREAM,
    )
    await processor.process_frame(
        LLMFullResponseEndFrame(),
        FrameDirection.DOWNSTREAM,
    )

    assert processor._state == State.READING
    # Force back to QA for the next test
    processor._state = State.QA
    collector.clear()

    # Second response — answer
    await processor.process_frame(
        LLMTextFrame(text=f"{INTENT_ANSWER} Here is the answer."),
        FrameDirection.DOWNSTREAM,
    )

    texts = collector.llm_text_frames()
    assert len(texts) == 1
    assert texts[0].text == "Here is the answer."


# ======================================================================
# Reading / TTS flow
# ======================================================================


@pytest.mark.asyncio
async def test_reading_advances_on_tts_stopped(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    # Simulate affirm to enter READING
    processor._state = State.READING
    processor._reading_tts_active = True
    collector.clear()

    await processor.process_frame(TTSStoppedFrame(), FrameDirection.DOWNSTREAM)

    assert processor._current_chunk_index == 1
    texts = collector.tts_texts()
    assert "There was a rabbit." in texts


@pytest.mark.asyncio
async def test_user_interrupt_switches_to_qa(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    processor._state = State.READING
    await processor.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)
    assert processor._state == State.QA


@pytest.mark.asyncio
async def test_interrupted_prevents_chunk_advance(processor, collector):
    """TTSStoppedFrame after interruption should NOT advance to next chunk."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    processor._state = State.READING
    processor._reading_tts_active = True
    collector.clear()

    # User interrupts
    await processor.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)
    assert processor._state == State.QA
    assert processor._interrupted is True

    # TTS stopped arrives after interruption
    collector.clear()
    await processor.process_frame(TTSStoppedFrame(), FrameDirection.DOWNSTREAM)

    # Should NOT have advanced — chunk index unchanged
    assert processor._current_chunk_index == 0
    tts_texts = collector.tts_texts()
    assert len(tts_texts) == 0
    assert processor._interrupted is False


@pytest.mark.asyncio
async def test_end_of_book(processor, collector):
    processor.push_frame = collector

    with _patch_supabase(progress=2):
        await processor.initialize_book("book_demo_001")

    processor._state = State.READING
    processor._reading_tts_active = True
    collector.clear()

    # TTS finishes last chunk → should announce end
    await processor.process_frame(TTSStoppedFrame(), FrameDirection.DOWNSTREAM)

    texts = collector.tts_texts()
    assert any("end" in t.lower() for t in texts)


@pytest.mark.asyncio
async def test_chunks_read_tracked_on_advance(processor, collector):
    """Advancing to next chunk should record the completed chunk index."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    processor._state = State.READING
    processor._reading_tts_active = True
    collector.clear()

    await processor.process_frame(TTSStoppedFrame(), FrameDirection.DOWNSTREAM)

    assert 0 in processor._chunks_read


# ======================================================================
# Progress persistence
# ======================================================================


@pytest.mark.asyncio
async def test_save_progress(processor):
    mock_save = MagicMock()
    with patch.multiple(
        "bot.processors.book_reader",
        get_book_metadata=MagicMock(return_value=FAKE_META),
        get_book_chunks=MagicMock(return_value=FAKE_CHUNKS),
        get_reading_progress=MagicMock(return_value=0),
        save_reading_progress=mock_save,
    ):
        await processor.initialize_book("book_demo_001")

        processor._current_chunk_index = 5
        processor.save_progress()

        mock_save.assert_called_once_with("book_demo_001", "test_kid", 5)


# ======================================================================
# Non-LLM frames pass through
# ======================================================================


@pytest.mark.asyncio
async def test_non_handled_frames_pass_through(processor, collector):
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    collector.clear()

    tts_frame = TTSSpeakFrame(text="hello")
    await processor.process_frame(tts_frame, FrameDirection.DOWNSTREAM)

    assert any(f is tts_frame for f, _ in collector.frames)


# ======================================================================
# Wait / re-prompt
# ======================================================================


@pytest.mark.asyncio
async def test_user_speaking_cancels_wait(processor, collector):
    """UserStartedSpeakingFrame should cancel any pending wait task."""
    processor.push_frame = collector

    with _patch_supabase():
        await processor.initialize_book("book_demo_001")

    processor._state = State.SELECTING_BOOK

    # Start a wait
    await processor._start_wait("short")
    assert processor._wait_task is not None

    # User speaks
    await processor.process_frame(UserStartedSpeakingFrame(), FrameDirection.DOWNSTREAM)
    assert processor._wait_task is None
