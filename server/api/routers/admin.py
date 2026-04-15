"""Admin-only endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from api.deps import check_is_admin

router = APIRouter(prefix="/admin", dependencies=[Depends(check_is_admin)])


@router.get("/is-admin")
async def is_admin():
    return True
