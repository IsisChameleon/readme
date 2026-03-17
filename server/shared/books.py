"""Lightweight book helpers shared across API and workers."""

from __future__ import annotations

from functools import lru_cache

from loguru import logger
from supabase import Client, create_client

from shared.config import settings


@lru_cache(maxsize=1)
def _get_client() -> Client:
    return create_client(settings.supabase.url, settings.supabase.secret_key)


def set_book_status(book_id: str, status: str) -> None:
    """Update books.status (e.g. to 'error' on failure)."""
    _get_client().table("books").update({"status": status}).eq("id", book_id).execute()
    logger.info("Set book status={} | book_id={}", status, book_id)
