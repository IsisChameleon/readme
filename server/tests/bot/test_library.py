"""Unit tests for the Library class."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from bot.library import Book, BookChunk, Library

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


def _patch_supabase(progress: int = 0, meta=FAKE_META, chunks=FAKE_CHUNKS, books=FAKE_BOOKS):
    return patch.multiple(
        "bot.library",
        list_books=MagicMock(return_value=books),
        get_book_metadata=MagicMock(return_value=meta),
        get_book_chunks=MagicMock(return_value=chunks),
        get_reading_progress=MagicMock(return_value=progress),
        save_reading_progress=MagicMock(),
    )


class TestLibraryListBooks:
    def test_list_books_returns_book_models(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase():
            books = lib.list_books()
        assert len(books) == 2
        assert all(isinstance(b, Book) for b in books)
        assert books[0].title == "The Rabbit"

    def test_list_books_empty(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase(books=[]):
            books = lib.list_books()
        assert books == []


class TestLibraryInitializeBook:
    def test_initialize_loads_metadata_and_chunks(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase():
            book = lib.initialize_book("book_001")
        assert book is not None
        assert book.title == "The Rabbit"
        assert lib.total_chunks == 3
        assert lib.current_chunk_index == 0

    def test_initialize_with_progress(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase(progress=2):
            lib.initialize_book("book_001")
        assert lib.current_chunk_index == 2

    def test_initialize_clamps_progress_past_end(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase(progress=99):
            lib.initialize_book("book_001")
        assert lib.current_chunk_index == 0

    def test_initialize_missing_book_returns_none(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase(meta=None):
            result = lib.initialize_book("nonexistent")
        assert result is None
        assert lib.book is None


class TestLibraryChunkNavigation:
    def test_current_chunk(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase():
            lib.initialize_book("book_001")
        chunk = lib.current_chunk()
        assert isinstance(chunk, BookChunk)
        assert chunk.text == "Once upon a time."

    def test_advance_chunk(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase():
            lib.initialize_book("book_001")
        chunk = lib.advance_chunk()
        assert chunk is not None
        assert chunk.chunk_index == 1
        assert lib.current_chunk_index == 1

    def test_advance_past_end_returns_none(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase(progress=2):
            lib.initialize_book("book_001")
        chunk = lib.advance_chunk()
        assert chunk is None

    def test_full_text(self):
        lib = Library(kid_id="kid1")
        with _patch_supabase():
            lib.initialize_book("book_001")
        text = lib.full_text()
        assert "Once upon a time." in text
        assert "The end." in text


class TestLibrarySaveProgress:
    def test_save_progress_calls_supabase(self):
        lib = Library(kid_id="kid1")
        mock_save = MagicMock()
        with patch.multiple(
            "bot.library",
            list_books=MagicMock(),
            get_book_metadata=MagicMock(return_value=FAKE_META),
            get_book_chunks=MagicMock(return_value=FAKE_CHUNKS),
            get_reading_progress=MagicMock(return_value=0),
            save_reading_progress=mock_save,
        ):
            lib.initialize_book("book_001")
            lib.current_chunk_index = 2
            lib.save_progress()
        mock_save.assert_called_once_with("book_001", "kid1", 2)

    def test_save_progress_noop_without_book(self):
        lib = Library(kid_id="kid1")
        lib.save_progress()  # should not raise
