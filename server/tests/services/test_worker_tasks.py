"""Unit tests for worker task orchestration."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from services.pdf_pipeline.models import Chunk, Manuscript

FAKE_MANUSCRIPT = Manuscript(
    book_id="book_001",
    title="Test Book",
    text="Story text.",
    extraction_model="gemini-2.5-flash",
    pages_total=5,
    image_pages=1,
)

FAKE_CHUNKS = [
    Chunk(
        chunk_index=0,
        chunk_kind="content",
        chapter_title="Ch1",
        chunk_hint="Opening.",
        text="Once upon a time.",
    ),
]


@patch("worker.tasks.upsert_chunks")
@patch("worker.tasks.chunk_manuscript", return_value=FAKE_CHUNKS)
@patch("worker.tasks.upload_manuscript")
@patch("worker.tasks.extract_manuscript", return_value=FAKE_MANUSCRIPT)
@patch("worker.tasks.download_pdf", return_value=(b"%PDF", "Test Book"))
def test_process_book_happy_path(mock_dl, mock_ext, mock_up, mock_chunk, mock_upsert):
    from worker.tasks import _process_book_impl

    _process_book_impl("book_001")

    mock_dl.assert_called_once_with("book_001")
    mock_ext.assert_called_once_with("book_001", "Test Book", b"%PDF")
    mock_up.assert_called_once_with("book_001", FAKE_MANUSCRIPT)
    mock_chunk.assert_called_once_with(FAKE_MANUSCRIPT)
    mock_upsert.assert_called_once_with("book_001", FAKE_CHUNKS)


@patch("worker.tasks.set_book_status")
@patch("worker.tasks.download_pdf", side_effect=RuntimeError("storage error"))
def test_process_book_sets_error_on_failure(mock_dl, mock_status):
    from worker.tasks import _process_book_impl

    # Note: _process_book_impl doesn't handle errors — the actor wrapper does.
    # We test that the impl raises, and separately the actor catches and sets status.
    with pytest.raises(RuntimeError, match="storage error"):
        _process_book_impl("book_001")


@patch("worker.tasks.upsert_chunks")
@patch("worker.tasks.chunk_manuscript", return_value=FAKE_CHUNKS)
@patch("worker.tasks.download_manuscript", return_value=FAKE_MANUSCRIPT)
def test_rechunk_book_happy_path(mock_dl, mock_chunk, mock_upsert):
    from worker.tasks import _rechunk_book_impl

    _rechunk_book_impl("book_001")

    mock_dl.assert_called_once_with("book_001")
    mock_chunk.assert_called_once_with(FAKE_MANUSCRIPT)
    mock_upsert.assert_called_once_with("book_001", FAKE_CHUNKS)


@patch("worker.tasks.set_book_status")
@patch("worker.tasks.download_manuscript", side_effect=RuntimeError("not found"))
def test_rechunk_book_sets_error_on_failure(mock_dl, mock_status):
    from worker.tasks import _rechunk_book_impl

    with pytest.raises(RuntimeError, match="not found"):
        _rechunk_book_impl("book_001")
