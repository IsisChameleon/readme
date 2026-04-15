"""FastAPI dependencies for authentication."""

from __future__ import annotations

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client

from shared.config import settings

_bearer_scheme = HTTPBearer()


def _get_supabase_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
):
    """Extract and verify the Supabase user from the Authorization header."""
    if not settings.supabase.url or not settings.supabase.secret_key:
        raise HTTPException(status_code=500, detail="Supabase is not configured.")

    client = create_client(settings.supabase.url, settings.supabase.secret_key)
    result = client.auth.get_user(credentials.credentials)

    if not result or not result.user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return result.user


async def get_authenticated_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    """Extract and verify the Supabase user from the Authorization header.

    Returns the user's ID (which equals their household_id).
    """
    return _get_supabase_user(credentials).id


async def check_is_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> str:
    """Verify the user is an admin. Returns user ID if authorized."""
    user = _get_supabase_user(credentials)
    if user.email not in settings.admin.allowed_emails:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user.id
