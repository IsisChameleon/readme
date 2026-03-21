from __future__ import annotations

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, field_validator
from supabase import Client, create_client

from shared.config import settings

router = APIRouter(prefix="/kids", tags=["kids"])


class CreateKidRequest(BaseModel):
    household_id: str
    name: str
    avatar: str | None = None
    color: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be empty")
        return v.strip()

    @field_validator("household_id")
    @classmethod
    def household_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("household_id must not be empty")
        return v.strip()


class KidResponse(BaseModel):
    id: str
    household_id: str
    name: str
    avatar: str | None = None
    color: str | None = None


def _supabase_client() -> Client:
    if not settings.supabase.url or not settings.supabase.secret_key:
        raise HTTPException(status_code=500, detail="Supabase is not configured.")
    return create_client(settings.supabase.url, settings.supabase.secret_key)


# NOTE: No auth on this endpoint yet. In production, validate that
# household_id matches the authenticated user. This is a known gap
# consistent with the existing POST /books/upload pattern.
@router.post("", response_model=KidResponse)
async def create_kid(request: CreateKidRequest) -> KidResponse:
    client = _supabase_client()

    avatar = request.avatar or request.name[0].upper()
    color = request.color or "#60A5FA"

    try:
        result = (
            client.table("kids")
            .insert(
                {
                    "household_id": request.household_id,
                    "name": request.name,
                    "avatar": avatar,
                    "color": color,
                }
            )
            .execute()
        )
    except Exception as exc:
        logger.exception("Failed to create kid")
        raise HTTPException(status_code=500, detail="Failed to create kid.") from exc

    row = result.data[0]
    return KidResponse(
        id=row["id"],
        household_id=row["household_id"],
        name=row["name"],
        avatar=row.get("avatar"),
        color=row.get("color"),
    )
