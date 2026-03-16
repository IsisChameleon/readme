#!/usr/bin/env python3
"""Create required Supabase Storage buckets for local development.

Usage:
    python infra/setup_storage.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# Load env from server/.env (where SUPABASE_* vars live)
repo_root = Path(__file__).resolve().parent.parent
load_dotenv(repo_root / "server" / ".env")
load_dotenv(repo_root / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET_NAME = os.getenv("SUPABASE_BOOKS_BUCKET", "books")


def main() -> None:
    if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
        print("Error: SUPABASE_URL and SUPABASE_SECRET_KEY must be set.", file=sys.stderr)
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

    # Check if bucket already exists
    existing = client.storage.list_buckets()
    existing_names = {b.name for b in existing}

    if BUCKET_NAME in existing_names:
        print(f"Bucket '{BUCKET_NAME}' already exists — nothing to do.")
        return

    client.storage.create_bucket(
        BUCKET_NAME,
        options={"public": False},
    )
    print(f"Created private bucket '{BUCKET_NAME}'.")


if __name__ == "__main__":
    main()
