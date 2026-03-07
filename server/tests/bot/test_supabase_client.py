"""Unit tests for Supabase client functions (mocked)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from bot.supabase_client import (
    get_book_chunks,
    get_book_metadata,
    get_reading_progress,
    save_reading_progress,
)


def _mock_client():
    """Create a mock Supabase client."""
    client = MagicMock()
    return client


def _mock_query_chain(client, table_name, data):
    """Set up a fluent query chain that returns data."""
    table = MagicMock()
    # Make every method return the same mock for chaining
    for method in ("select", "eq", "order", "upsert"):
        getattr(table, method).return_value = table
    resp = MagicMock()
    resp.data = data
    table.execute.return_value = resp
    client.table.return_value = table
    return table


@patch("bot.supabase_client._get_client")
def test_get_book_metadata_found(mock_get):
    client = _mock_client()
    mock_get.return_value = client
    _mock_query_chain(client, "books", [{"id": "b1", "title": "Alice", "status": "ready"}])

    result = get_book_metadata("b1")
    assert result == {"id": "b1", "title": "Alice", "status": "ready"}


@patch("bot.supabase_client._get_client")
def test_get_book_metadata_not_found(mock_get):
    client = _mock_client()
    mock_get.return_value = client
    _mock_query_chain(client, "books", [])

    result = get_book_metadata("missing")
    assert result is None


@patch("bot.supabase_client._get_client")
def test_get_book_chunks(mock_get):
    client = _mock_client()
    mock_get.return_value = client
    chunks = [
        {"chunk_index": 0, "text": "Hello"},
        {"chunk_index": 1, "text": "World"},
    ]
    _mock_query_chain(client, "book_chunks", chunks)

    result = get_book_chunks("b1")
    assert len(result) == 2
    assert result[0]["text"] == "Hello"


@patch("bot.supabase_client._get_client")
def test_get_reading_progress_default(mock_get):
    client = _mock_client()
    mock_get.return_value = client
    _mock_query_chain(client, "reading_progress", [])

    result = get_reading_progress("b1", "s1")
    assert result == 0


@patch("bot.supabase_client._get_client")
def test_get_reading_progress_existing(mock_get):
    client = _mock_client()
    mock_get.return_value = client
    _mock_query_chain(client, "reading_progress", [{"current_chunk_index": 7}])

    result = get_reading_progress("b1", "s1")
    assert result == 7


@patch("bot.supabase_client._get_client")
def test_save_reading_progress(mock_get):
    client = _mock_client()
    mock_get.return_value = client
    table = _mock_query_chain(client, "reading_progress", None)

    save_reading_progress("b1", "s1", 3)

    table.upsert.assert_called_once()
    call_args = table.upsert.call_args[0][0]
    assert call_args["book_id"] == "b1"
    assert call_args["kid_id"] == "s1"
    assert call_args["current_chunk_index"] == 3
