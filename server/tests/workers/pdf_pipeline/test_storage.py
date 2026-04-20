"""Unit tests for pdf_pipeline storage helpers."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from workers.pdf_pipeline.models import Chapter, Chunk, Manuscript
from workers.pdf_pipeline.storage import (
    download_manuscript,
    download_pdf,
    set_book_status,
    upload_manuscript,
    upsert_chunks,
)

FAKE_BOOK_ROW = {
    "id": "book_001",
    "title": "Test Book",
    "storage_path": "households/hh1/books/book_001/mybook.pdf",
}


def _mock_supabase():
    """Return a mock Supabase client with chainable table/storage methods."""
    client = MagicMock()
    table_mock = MagicMock()
    client.table.return_value = table_mock
    storage_mock = MagicMock()
    client.storage.from_.return_value = storage_mock
    return client, table_mock, storage_mock


class TestDownloadPdf:
    @patch("workers.pdf_pipeline.storage.get_client")
    def test_returns_bytes_and_title(self, mock_get_client):
        client, table_mock, storage_mock = _mock_supabase()
        mock_get_client.return_value = client
        table_mock.select.return_value.eq.return_value.execute.return_value.data = [FAKE_BOOK_ROW]
        storage_mock.download.return_value = b"%PDF-fake"

        pdf_bytes, title = download_pdf("book_001")

        assert pdf_bytes == b"%PDF-fake"
        assert title == "Test Book"
        storage_mock.download.assert_called_once_with("households/hh1/books/book_001/mybook.pdf")

    @patch("workers.pdf_pipeline.storage.get_client")
    def test_raises_on_missing_book(self, mock_get_client):
        client, table_mock, _ = _mock_supabase()
        mock_get_client.return_value = client
        table_mock.select.return_value.eq.return_value.execute.return_value.data = []

        with pytest.raises(ValueError, match="not found"):
            download_pdf("nonexistent")


class TestUploadManuscript:
    @patch("workers.pdf_pipeline.storage.get_client")
    def test_uploads_json_to_correct_path(self, mock_get_client):
        client, table_mock, storage_mock = _mock_supabase()
        mock_get_client.return_value = client
        table_mock.select.return_value.eq.return_value.execute.return_value.data = [FAKE_BOOK_ROW]

        manuscript = Manuscript(
            book_id="book_001",
            title="Test Book",
            chapters=[Chapter(title=None, text="Story text.")],
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        upload_manuscript("book_001", manuscript)

        storage_mock.upload.assert_called_once()
        call_args = storage_mock.upload.call_args
        assert call_args.kwargs["path"] == "households/hh1/books/book_001/manuscript.json"


class TestDownloadManuscript:
    @patch("workers.pdf_pipeline.storage.get_client")
    def test_parses_json_to_manuscript(self, mock_get_client):
        client, table_mock, storage_mock = _mock_supabase()
        mock_get_client.return_value = client
        table_mock.select.return_value.eq.return_value.execute.return_value.data = [FAKE_BOOK_ROW]

        manuscript = Manuscript(
            book_id="book_001",
            title="Test Book",
            chapters=[Chapter(title=None, text="Story text.")],
            extraction_model="gemini-2.5-flash",
            pages_total=5,
            image_pages=1,
        )
        storage_mock.download.return_value = manuscript.model_dump_json().encode()

        result = download_manuscript("book_001")
        assert result.book_id == "book_001"
        assert result.chapters[0].text == "Story text."


class TestUpsertChunks:
    @patch("workers.pdf_pipeline.storage.get_client")
    def test_deletes_then_inserts_then_updates_status(self, mock_get_client):
        client, table_mock, _ = _mock_supabase()
        mock_get_client.return_value = client

        chunks = [
            Chunk(
                chunk_index=0,
                chunk_kind="content",
                chapter_title="Ch1",
                chunk_hint="Opening.",
                text="Once upon a time.",
            ),
        ]
        upsert_chunks("book_001", chunks)

        table_mock.delete.assert_called()
        table_mock.insert.assert_called()


class TestSetBookStatus:
    @patch("shared.books.get_client")
    def test_updates_status(self, mock_get_client):
        client, table_mock, _ = _mock_supabase()
        mock_get_client.return_value = client

        set_book_status("book_001", "error")
        table_mock.update.assert_called()
