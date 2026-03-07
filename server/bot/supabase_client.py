"""Supabase data access for the reading bot."""

from __future__ import annotations

import os
from functools import lru_cache

from loguru import logger
from supabase import Client, create_client


@lru_cache(maxsize=1)
def _get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    return create_client(url, key)


def list_books() -> list[dict]:
    """Return all books where status='ready'."""
    resp = _get_client().table("books").select("id, title, status").eq("status", "ready").execute()
    return resp.data or []


def get_book_metadata(book_id: str) -> dict | None:
    """Return {id, title, status} or None."""
    resp = _get_client().table("books").select("id, title, status").eq("id", book_id).execute()
    if not resp.data:
        return None
    return resp.data[0]


def get_book_chunks(book_id: str) -> list[dict]:
    """Fetch all chunks ordered by chunk_index."""
    resp = (
        _get_client()
        .table("book_chunks")
        .select("chunk_index, chapter_title, page_start, page_end, text")
        .eq("book_id", book_id)
        .order("chunk_index")
        .execute()
    )
    return resp.data or []


def get_reading_progress(book_id: str, kid_id: str) -> int:
    """Return current_chunk_index, default 0."""
    resp = (
        _get_client()
        .table("reading_progress")
        .select("current_chunk_index")
        .eq("book_id", book_id)
        .eq("kid_id", kid_id)
        .execute()
    )
    if not resp.data:
        return 0
    return resp.data[0]["current_chunk_index"]


def save_reading_progress(book_id: str, kid_id: str, chunk_index: int) -> None:
    """Upsert reading_progress row."""
    _get_client().table("reading_progress").upsert(
        {
            "book_id": book_id,
            "kid_id": kid_id,
            "current_chunk_index": chunk_index,
            "updated_at": "now()",
        },
        on_conflict="book_id,kid_id",
    ).execute()
    logger.info(f"Saved progress: book={book_id} session={kid_id} chunk={chunk_index}")
