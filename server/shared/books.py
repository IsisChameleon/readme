"""Lightweight book helpers shared across API and workers."""

from __future__ import annotations

from loguru import logger

from shared.supabase import get_client


def set_book_status(book_id: str, status: str) -> None:
    """Update books.status (e.g. to 'error' on failure)."""
    get_client().table("books").update({"status": status}).eq("id", book_id).execute()
    logger.info("Set book status={} | book_id={}", status, book_id)
