"""Library — wraps Supabase data access with stateful book/position tracking."""

from __future__ import annotations

from enum import StrEnum

from loguru import logger
from pydantic import BaseModel

try:
    from .supabase_client import (
        get_book_chunks,
        get_book_metadata,
        get_chunk_at,
        get_kid_progress,
        get_reading_progress,
        list_books,
        save_reading_progress,
    )
except ImportError:
    from supabase_client import (  # type: ignore[assignment]
        get_book_chunks,
        get_book_metadata,
        get_chunk_at,
        get_kid_progress,
        get_reading_progress,
        list_books,
        save_reading_progress,
    )


class ChunkKind(StrEnum):
    CONTENT = "content"
    CHAPTER_TITLE = "chapter_title"


class Book(BaseModel):
    id: str
    title: str
    status: str


class BookChunk(BaseModel):
    chunk_index: int
    chunk_kind: ChunkKind = ChunkKind.CONTENT
    chapter_title: str
    chunk_hint: str = ""
    text: str


class Library:
    """Stateful wrapper around book data. Holds the loaded book and current position."""

    def __init__(self, kid_id: str):
        self._kid_id = kid_id
        self._book: Book | None = None
        self._chunks: list[BookChunk] = []
        self._current_chunk_index = 0
        self._chapter_map: dict[str, int] = {}

    @property
    def book(self) -> Book | None:
        return self._book

    @property
    def current_chunk_index(self) -> int:
        return self._current_chunk_index

    @current_chunk_index.setter
    def current_chunk_index(self, value: int) -> None:
        self._current_chunk_index = value

    @property
    def chapter_map(self) -> dict[str, int]:
        return self._chapter_map

    @property
    def total_chunks(self) -> int:
        return len(self._chunks)

    def list_books(self) -> list[Book]:
        rows = list_books()
        return [Book(**row) for row in rows]

    def get_books_with_progress(self) -> list[dict]:
        """Return books enriched with per-kid reading progress and chunk context."""
        books = self.list_books()
        progress_rows = get_kid_progress(self._kid_id)
        progress_map = {r["book_id"]: r["current_chunk_index"] for r in progress_rows}

        result = []
        for b in books:
            entry: dict = {"id": b.id, "title": b.title, "status": b.status}
            chunk_index = progress_map.get(b.id, 0)
            if chunk_index > 0:
                entry["current_chunk_index"] = chunk_index
                chunk = get_chunk_at(b.id, chunk_index)
                if chunk:
                    entry["chapter_title"] = chunk["chapter_title"]
                    entry["chunk_text"] = chunk["text"]
            result.append(entry)
        return result

    def initialize_book(self, book_id: str) -> Book | None:
        meta = get_book_metadata(book_id)
        if not meta:
            logger.error(f"Book not found: {book_id}")
            return None

        self._book = Book(**meta)
        raw_chunks = get_book_chunks(book_id)
        self._chunks = [BookChunk(**c) for c in raw_chunks]
        self._chapter_map = {}
        for chunk in self._chunks:
            if chunk.chapter_title not in self._chapter_map:
                self._chapter_map[chunk.chapter_title] = chunk.chunk_index
        self._current_chunk_index = get_reading_progress(book_id, self._kid_id)

        if self._current_chunk_index >= len(self._chunks):
            self._current_chunk_index = 0

        logger.info(
            f"Book loaded: {self._book.title}, {len(self._chunks)} chunks, "
            f"resuming at {self._current_chunk_index}"
        )
        return self._book

    def current_chunk(self) -> BookChunk | None:
        if not self._chunks or self._current_chunk_index >= len(self._chunks):
            return None
        return self._chunks[self._current_chunk_index]

    def advance_chunk(self) -> BookChunk | None:
        self._current_chunk_index += 1
        return self.current_chunk()

    def full_text(self) -> str:
        return "\n\n".join(c.text for c in self._chunks)

    def save_progress(self) -> None:
        if not self._book or not self._chunks:
            return
        try:
            save_reading_progress(self._book.id, self._kid_id, self._current_chunk_index)
        except Exception:
            logger.exception("Failed to save reading progress")
