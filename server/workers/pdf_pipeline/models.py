"""Data models for the PDF extraction and chunking pipeline."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class PageContent(BaseModel):
    """A single extracted PDF page. Internal to extraction, not persisted."""

    page_number: int
    text: str
    image_bytes: bytes | None = None


class Manuscript(BaseModel):
    """Cleaned full-text output of extraction. Persisted to Supabase Storage."""

    book_id: str
    title: str
    text: str
    extraction_model: str
    pages_total: int
    image_pages: int


class LLMChunk(BaseModel):
    """Raw chunk shape returned by Gemini (no chunk_index)."""

    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str
    text: str


class Chunk(BaseModel):
    """Final chunk with assigned index. Used for DB insertion."""

    chunk_index: int
    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str
    text: str
