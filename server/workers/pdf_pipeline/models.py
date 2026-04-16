"""Data models for the PDF extraction and chunking pipeline."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class PageContent(BaseModel):
    """A single extracted PDF page. Internal to extraction, not persisted."""

    page_number: int
    text: str
    image_bytes: bytes | None = None


class Chapter(BaseModel):
    """One chapter. Order is determined by list position; no explicit index."""

    title: str | None  # None for untitled/single-chapter books
    text: str  # verbatim body (no heading in the text)


class Manuscript(BaseModel):
    """Cleaned, structured output of extraction. Persisted to Supabase Storage."""

    book_id: str
    title: str
    chapters: list[Chapter]  # ordered, always >= 1
    extraction_model: str
    pages_total: int
    image_pages: int


class _ChapterTitles(BaseModel):
    """Internal structured-output wrapper for the chapter-detection call."""

    titles: list[str]


class LLMChunk(BaseModel):
    """Raw chunker output — kind/title are added at the caller."""

    chunk_hint: str
    text: str


class Chunk(BaseModel):
    """Final chunk with assigned index. Used for DB insertion."""

    chunk_index: int
    chunk_kind: Literal["content", "chapter_title"]
    chapter_title: str
    chunk_hint: str
    text: str
