from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
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


class UpdateKidRequest(BaseModel):
    name: str | None = None
    color: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("name must not be empty")
        return v.strip() if v else v


@router.patch("/{kid_id}", response_model=KidResponse)
async def update_kid(kid_id: str, request: UpdateKidRequest) -> KidResponse:
    updates = request.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "name" in updates:
        updates["avatar"] = updates["name"][0].upper()

    client = _supabase_client()
    try:
        result = client.table("kids").update(updates).eq("id", kid_id).execute()
    except Exception as exc:
        logger.exception("Failed to update kid")
        raise HTTPException(status_code=500, detail="Failed to update kid.") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Kid not found")

    row = result.data[0]
    return KidResponse(
        id=row["id"],
        household_id=row["household_id"],
        name=row["name"],
        avatar=row.get("avatar"),
        color=row.get("color"),
    )


@router.delete("/{kid_id}", status_code=204)
async def delete_kid(kid_id: str) -> Response:
    client = _supabase_client()
    try:
        # Delete reading progress first (foreign key)
        client.table("reading_progress").delete().eq("kid_id", kid_id).execute()
        result = client.table("kids").delete().eq("id", kid_id).execute()
    except Exception as exc:
        logger.exception("Failed to delete kid")
        raise HTTPException(status_code=500, detail="Failed to delete kid.") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Kid not found")

    return Response(status_code=204)
