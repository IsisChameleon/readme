"""Supabase Storage I/O and chunk management for the PDF pipeline."""

from __future__ import annotations

from functools import lru_cache
from pathlib import PurePosixPath

from loguru import logger
from supabase import Client, create_client

try:
    from shared.config import settings
except ImportError:
    from server.shared.config import settings  # type: ignore

from .models import Chunk, Manuscript


@lru_cache(maxsize=1)
def _get_client() -> Client:
    return create_client(settings.supabase.url, settings.supabase.secret_key)


def _get_book_row(book_id: str) -> dict:
    """Fetch book row or raise ValueError."""
    resp = (
        _get_client().table("books").select("id, title, storage_path").eq("id", book_id).execute()
    )
    if not resp.data:
        raise ValueError(f"Book not found: {book_id}")
    return resp.data[0]


def _manuscript_path(storage_path: str) -> str:
    """Derive manuscript.json path from the PDF storage_path."""
    parent = str(PurePosixPath(storage_path).parent)
    return f"{parent}/manuscript.json"


def _bucket() -> str:
    return settings.supabase.books_bucket


def download_pdf(book_id: str) -> tuple[bytes, str]:
    """Download PDF from Supabase Storage. Returns (pdf_bytes, title)."""
    row = _get_book_row(book_id)
    storage = _get_client().storage.from_(_bucket())
    pdf_bytes = storage.download(row["storage_path"])
    logger.info("Downloaded PDF | book_id={} size={}", book_id, len(pdf_bytes))
    return pdf_bytes, row["title"]


def upload_manuscript(book_id: str, manuscript: Manuscript) -> None:
    """Upload manuscript.json alongside the PDF in storage."""
    row = _get_book_row(book_id)
    path = _manuscript_path(row["storage_path"])
    storage = _get_client().storage.from_(_bucket())
    data = manuscript.model_dump_json().encode()
    storage.upload(
        path=path,
        file=data,
        file_options={"content-type": "application/json", "upsert": "true"},
    )
    logger.info("Uploaded manuscript | book_id={} path={}", book_id, path)


def download_manuscript(book_id: str) -> Manuscript:
    """Download existing manuscript.json from storage."""
    row = _get_book_row(book_id)
    path = _manuscript_path(row["storage_path"])
    storage = _get_client().storage.from_(_bucket())
    data = storage.download(path)
    logger.info("Downloaded manuscript | book_id={}", book_id)
    return Manuscript.model_validate_json(data)


def upsert_chunks(book_id: str, chunks: list[Chunk]) -> None:
    """Replace all chunks for a book, update status to 'ready', reset reading progress."""
    client = _get_client()

    # 1. Delete existing chunks
    client.table("book_chunks").delete().eq("book_id", book_id).execute()
    logger.info("Deleted old chunks | book_id={}", book_id)

    # 2. Insert new chunks in batches
    batch_size = 50
    rows = [
        {
            "book_id": book_id,
            "chunk_index": c.chunk_index,
            "chunk_kind": c.chunk_kind,
            "chapter_title": c.chapter_title,
            "chunk_hint": c.chunk_hint,
            "text": c.text,
        }
        for c in chunks
    ]
    for i in range(0, len(rows), batch_size):
        client.table("book_chunks").insert(rows[i : i + batch_size]).execute()

    # 3. Update book status
    client.table("books").update({"status": "ready"}).eq("id", book_id).execute()

    # 4. Reset reading progress
    client.table("reading_progress").update({"current_chunk_index": 0}).eq(
        "book_id", book_id
    ).execute()

    logger.info("Upserted {} chunks, status=ready | book_id={}", len(chunks), book_id)


def set_book_status(book_id: str, status: str) -> None:
    """Update books.status (e.g. to 'error' on failure)."""
    _get_client().table("books").update({"status": status}).eq("id", book_id).execute()
    logger.info("Set book status={} | book_id={}", status, book_id)
