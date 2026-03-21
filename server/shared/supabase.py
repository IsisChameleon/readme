"""Single Supabase client factory — used by bot, API, and workers."""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from shared.config import settings


@lru_cache(maxsize=1)
def get_client() -> Client:
    return create_client(settings.supabase.url, settings.supabase.secret_key)
