"""Unit tests for pdf_pipeline chunking."""

from __future__ import annotations

from unittest.mock import patch

from workers.pdf_pipeline.chunk import chunk_chapter
from workers.pdf_pipeline.models import Chapter, Chunk, LLMChunk


class TestChunkChapter:
    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_titled_chapter_emits_title_chunk_then_body(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="Dursleys arrive.", text="Mr. and Mrs. Dursley..."),
            LLMChunk(chunk_hint="They go to work.", text="He drove to work..."),
        ]
        chapter = Chapter(title="The Boy Who Lived", text="Mr. and Mrs. Dursley...")

        result = chunk_chapter(chapter, starting_index=0)

        assert len(result) == 3
        assert result[0].chunk_kind == "chapter_title"
        assert result[0].chunk_index == 0
        assert result[0].chapter_title == "The Boy Who Lived"
        assert result[0].text == "The Boy Who Lived"
        assert result[1].chunk_kind == "content"
        assert result[1].chunk_index == 1
        assert result[1].chapter_title == "The Boy Who Lived"
        assert result[2].chunk_index == 2

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_untitled_chapter_emits_only_content_chunks(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="Rabbit runs.", text="The rabbit ran fast."),
        ]
        chapter = Chapter(title=None, text="The rabbit ran fast.")

        result = chunk_chapter(chapter, starting_index=0)

        assert len(result) == 1
        assert result[0].chunk_kind == "content"
        assert result[0].chunk_index == 0
        assert result[0].chapter_title == ""  # empty string for untitled

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_starting_index_is_respected(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="Body.", text="Some body text."),
        ]
        chapter = Chapter(title="Chapter 2", text="Some body text.")

        result = chunk_chapter(chapter, starting_index=10)

        assert [c.chunk_index for c in result] == [10, 11]

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_empty_body_titled_chapter_still_emits_title_chunk(self, mock_chunk):
        mock_chunk.return_value = []
        chapter = Chapter(title="Chapter 1", text="")

        result = chunk_chapter(chapter, starting_index=0)

        assert len(result) == 1
        assert result[0].chunk_kind == "chapter_title"

    @patch("workers.pdf_pipeline.chunk._gemini_chunk")
    def test_returns_chunk_instances(self, mock_chunk):
        mock_chunk.return_value = [
            LLMChunk(chunk_hint="H.", text="Body."),
        ]
        result = chunk_chapter(Chapter(title=None, text="Body."), starting_index=0)
        assert all(isinstance(c, Chunk) for c in result)
