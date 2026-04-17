"""Unit tests for worker task orchestration."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from workers.pdf_pipeline.models import Chapter, Chunk, Manuscript

FAKE_MANUSCRIPT = Manuscript(
    book_id="book_001",
    title="Test Book",
    chapters=[
        Chapter(title="Chapter 1", text="First chapter body."),
        Chapter(title=None, text="Untitled chapter body."),
    ],
    extraction_model="gemini-2.5-flash",
    pages_total=5,
    image_pages=1,
)


@patch("workers.book_processor_jobs.upsert_chunks")
@patch("workers.book_processor_jobs.chunk_chapter")
@patch("workers.book_processor_jobs.upload_manuscript")
@patch("workers.book_processor_jobs.extract_manuscript", return_value=FAKE_MANUSCRIPT)
@patch("workers.book_processor_jobs.download_pdf", return_value=(b"%PDF", "Test Book"))
def test_process_book_happy_path(mock_dl, mock_ext, mock_up, mock_chunk_chapter, mock_upsert):
    from workers.book_processor_jobs import process_book_job

    # Return one chunk per chapter call (titled chapter emits 2 -> title + body; we simplify here)
    mock_chunk_chapter.side_effect = [
        [
            Chunk(
                chunk_index=0,
                chunk_kind="chapter_title",
                chapter_title="Chapter 1",
                chunk_hint="Start of chapter: Chapter 1",
                text="Chapter 1",
            ),
            Chunk(
                chunk_index=1,
                chunk_kind="content",
                chapter_title="Chapter 1",
                chunk_hint="Body.",
                text="First chapter body.",
            ),
        ],
        [
            Chunk(
                chunk_index=2,
                chunk_kind="content",
                chapter_title="",
                chunk_hint="Body.",
                text="Untitled chapter body.",
            )
        ],
    ]

    process_book_job("book_001")

    mock_dl.assert_called_once_with("book_001")
    mock_ext.assert_called_once_with("book_001", "Test Book", b"%PDF")
    mock_up.assert_called_once_with("book_001", FAKE_MANUSCRIPT)
    assert mock_chunk_chapter.call_count == 2
    # starting_index is 0 for first chapter, 2 after the first chapter produced 2 chunks
    assert mock_chunk_chapter.call_args_list[0].kwargs["starting_index"] == 0
    assert mock_chunk_chapter.call_args_list[1].kwargs["starting_index"] == 2
    # upsert_chunks called exactly once, with flattened list of 3 chunks
    mock_upsert.assert_called_once()
    _, passed_chunks = mock_upsert.call_args.args
    assert len(passed_chunks) == 3
    assert [c.chunk_index for c in passed_chunks] == [0, 1, 2]


@patch("workers.book_processor_jobs.set_book_status")
@patch("workers.book_processor_jobs.upsert_chunks")
@patch("workers.book_processor_jobs.download_pdf", side_effect=RuntimeError("storage error"))
def test_process_book_sets_error_on_failure(mock_dl, mock_upsert, mock_status):
    from workers.book_processor_jobs import process_book_job

    with pytest.raises(RuntimeError, match="storage error"):
        process_book_job("book_001")

    mock_status.assert_called_once_with("book_001", "error")
    mock_upsert.assert_not_called()


@patch("workers.book_processor_jobs.upsert_chunks")
@patch("workers.book_processor_jobs.chunk_chapter")
@patch("workers.book_processor_jobs.download_manuscript", return_value=FAKE_MANUSCRIPT)
def test_rechunk_book_happy_path(mock_dl, mock_chunk_chapter, mock_upsert):
    from workers.book_processor_jobs import rechunk_book_job

    mock_chunk_chapter.side_effect = [
        [
            Chunk(
                chunk_index=0,
                chunk_kind="content",
                chapter_title="Chapter 1",
                chunk_hint="H.",
                text="First.",
            )
        ],
        [
            Chunk(
                chunk_index=1,
                chunk_kind="content",
                chapter_title="",
                chunk_hint="H.",
                text="Second.",
            )
        ],
    ]

    rechunk_book_job("book_001")

    mock_dl.assert_called_once_with("book_001")
    assert mock_chunk_chapter.call_count == 2
    mock_upsert.assert_called_once()
    _, passed_chunks = mock_upsert.call_args.args
    assert len(passed_chunks) == 2


@patch("workers.book_processor_jobs.set_book_status")
@patch("workers.book_processor_jobs.download_manuscript", side_effect=RuntimeError("not found"))
def test_rechunk_book_sets_error_on_failure(mock_dl, mock_status):
    from workers.book_processor_jobs import rechunk_book_job

    with pytest.raises(RuntimeError, match="not found"):
        rechunk_book_job("book_001")

    mock_status.assert_called_once_with("book_001", "error")
