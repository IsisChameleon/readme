"""FastAPI dependencies for authentication."""

from __future__ import annotations

from fastapi import Header, HTTPException
from supabase import create_client

from shared.config import settings


async def get_authenticated_user_id(
    authorization: str = Header(..., description="Bearer <supabase_access_token>"),
) -> str:
    """Extract and verify the Supabase user from the Authorization header.

    Returns the user's ID (which equals their household_id).
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    token = authorization.removeprefix("Bearer ")

    if not settings.supabase.url or not settings.supabase.secret_key:
        raise HTTPException(status_code=500, detail="Supabase is not configured.")

    client = create_client(settings.supabase.url, settings.supabase.secret_key)
    result = client.auth.get_user(token)

    if not result or not result.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return result.user.id
