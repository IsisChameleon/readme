"""Unit tests for pdf_pipeline chunking."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from workers.pdf_pipeline.chunk import _assign_indices, chunk_manuscript
from workers.pdf_pipeline.models import Chunk, LLMChunk, Manuscript

SAMPLE_MANUSCRIPT = Manuscript(
    book_id="book_001",
    title="Test Book",
    text="Once upon a time there was a brave little rabbit. " * 20,
    extraction_model="gemini-2.5-flash",
    pages_total=5,
    image_pages=1,
)


class TestAssignIndices:
    def test_sequential_indices(self):
        llm_chunks = [
            LLMChunk(
                chunk_kind="content",
                chapter_title="Ch1",
                chunk_hint="Opening.",
                text="First chunk.",
            ),
            LLMChunk(
                chunk_kind="chapter_title",
                chapter_title="Ch2",
                chunk_hint="New chapter.",
                text="Chapter 2",
            ),
            LLMChunk(
                chunk_kind="content",
                chapter_title="Ch2",
                chunk_hint="Continues.",
                text="Second chunk.",
            ),
        ]
        chunks = _assign_indices(llm_chunks)
        assert len(chunks) == 3
        assert [c.chunk_index for c in chunks] == [0, 1, 2]
        assert all(isinstance(c, Chunk) for c in chunks)
        assert chunks[1].chunk_kind == "chapter_title"


class TestChunkManuscript:
    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_returns_indexed_chunks(self, mock_gemini):
        mock_gemini.return_value = [
            LLMChunk(
                chunk_kind="content",
                chapter_title="Chapter 1",
                chunk_hint="The rabbit sets out on an adventure.",
                text="Once upon a time there was a brave little rabbit.",
            ),
            LLMChunk(
                chunk_kind="content",
                chapter_title="Chapter 1",
                chunk_hint="The rabbit meets a friend.",
                text="The rabbit met a friendly fox.",
            ),
        ]

        chunks = chunk_manuscript(SAMPLE_MANUSCRIPT)

        assert len(chunks) == 2
        assert chunks[0].chunk_index == 0
        assert chunks[1].chunk_index == 1
        assert chunks[0].chunk_hint == "The rabbit sets out on an adventure."
        mock_gemini.assert_called_once()

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_empty_manuscript_returns_empty(self, mock_gemini):
        mock_gemini.return_value = []
        empty = Manuscript(
            book_id="book_002",
            title="Empty",
            text="",
            extraction_model="gemini-2.5-flash",
            pages_total=0,
            image_pages=0,
        )
        chunks = chunk_manuscript(empty)
        assert chunks == []
