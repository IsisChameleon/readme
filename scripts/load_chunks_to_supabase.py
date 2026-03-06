#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "supabase>=2.27.0",
#   "python-dotenv>=1.2.1",
# ]
# ///
"""Load chunked book JSON into Supabase (books + book_chunks tables).

Usage:
    python scripts/load_chunks_to_supabase.py --input scripts/output/alice_chunks_plan_b_first2.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

import os


def load_chunks(input_path: Path) -> None:
    data = json.loads(input_path.read_text(encoding="utf-8"))

    url = os.environ["SUPABASE_URL"]
    key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    sb = create_client(url, key)

    book_id = data["book_id"]
    title = data["title"]

    # Upsert book row
    sb.table("books").upsert(
        {
            "id": book_id,
            "household_id": "default",
            "title": title,
            "storage_path": f"books/{book_id}.json",
            "status": "ready",
        },
        on_conflict="id",
    ).execute()
    print(f"Upserted book: {book_id} — {title}")

    # Build chunk rows
    rows = []
    for idx, chunk in enumerate(data["chunks"]):
        rows.append(
            {
                "book_id": book_id,
                "chunk_index": idx,
                "chapter_title": chunk.get("chapter_title", ""),
                "page_start": chunk.get("page_start"),
                "page_end": chunk.get("page_end"),
                "text": chunk["text"],
            }
        )

    # Upsert in batches of 50
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        sb.table("book_chunks").upsert(
            batch,
            on_conflict="book_id,chunk_index",
        ).execute()

    print(f"Upserted {len(rows)} chunks for book {book_id}")


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "server" / ".env")

    parser = argparse.ArgumentParser(description="Load chunked book JSON into Supabase.")
    parser.add_argument("--input", type=Path, required=True, help="Path to chunked JSON file.")
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(f"Input file not found: {args.input}")

    load_chunks(args.input)


if __name__ == "__main__":
    main()
