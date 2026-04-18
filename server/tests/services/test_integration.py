"""Integration test for the full PDF ingestion pipeline using recorded LLM fixtures.

See server/tests/fixtures/README.md for how to record fixtures.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import pytest

from workers.pdf_pipeline.models import LLMChunk

FIXTURE_ROOT = Path(__file__).resolve().parent.parent / "fixtures"
ALICE_DIR = FIXTURE_ROOT / "alice"


def _pdf_path() -> Path | None:
    if not ALICE_DIR.exists():
        return None
    pdfs = list(ALICE_DIR.glob("*.pdf"))
    return pdfs[0] if pdfs else None


def _load_cleaned_batches() -> list[str]:
    files = sorted(ALICE_DIR.glob("clean_batch_*.txt"))
    return [f.read_text() for f in files]


def _load_detected_chapters() -> list[str]:
    return json.loads((ALICE_DIR / "detected_chapters.json").read_text())


def _load_per_chapter_chunks() -> list[list[LLMChunk]]:
    files = sorted(ALICE_DIR.glob("chunks_chapter_*.json"))
    return [[LLMChunk(**c) for c in json.loads(f.read_text())] for f in files]


def _load_expected_chunks() -> list[dict]:
    return json.loads((ALICE_DIR / "expected_chunks.json").read_text())


pytestmark = pytest.mark.skipif(
    _pdf_path() is None,
    reason="Alice fixtures not recorded. See server/tests/fixtures/README.md.",
)


@patch("workers.book_processor_jobs.upsert_chunks")
@patch("workers.book_processor_jobs.upload_manuscript")
@patch("workers.pdf_pipeline.chunk._gemini_chunk")
@patch("workers.pdf_pipeline.extract._detect_chapters")
@patch("workers.pdf_pipeline.extract._clean_batch")
@patch("workers.book_processor_jobs.download_pdf")
def test_alice_end_to_end(
    mock_download,
    mock_clean,
    mock_detect,
    mock_gemini_chunk,
    mock_upload,
    mock_upsert,
):
    from workers.book_processor_jobs import process_book_job

    pdf_bytes = _pdf_path().read_bytes()
    mock_download.return_value = (pdf_bytes, "Alice in Wonderland")
    mock_clean.side_effect = _load_cleaned_batches()
    mock_detect.return_value = _load_detected_chapters()
    mock_gemini_chunk.side_effect = _load_per_chapter_chunks()

    process_book_job("fixture_book")

    mock_upload.assert_called_once()
    mock_upsert.assert_called_once()

    _, actual_chunk_objects = mock_upsert.call_args.args
    actual = [c.model_dump() for c in actual_chunk_objects]
    expected = _load_expected_chunks()

    assert actual == expected
