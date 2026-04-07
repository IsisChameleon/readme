"""Voice session /start endpoint (Modal only).

For local dev and Pipecat Cloud, the client calls the Pipecat runner or
PCC /start endpoint directly — this endpoint is not involved.

For Modal, the client calls this endpoint which creates a Daily room,
spawns the bot on Modal, and returns the room URL + token.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel
from supabase import create_client

from api.deps import get_authenticated_user_id
from api.services.daily import DailyAPI, DailyAPIError
from shared.config import settings

router = APIRouter(
    tags=["voice"],
    dependencies=[Depends(get_authenticated_user_id)],
)


class StartSessionRequest(BaseModel):
    book_id: str | None = None
    kid_id: str | None = None


class StartSessionResponse(BaseModel):
    room_url: str
    token: str


@router.post("/start", response_model=StartSessionResponse)
async def start_session(
    request: StartSessionRequest | None = None,
    user_id: str = Depends(get_authenticated_user_id),
) -> StartSessionResponse:
    book_id = request.book_id if request else None
    kid_id = request.kid_id if request else None

    if kid_id:
        client = create_client(settings.supabase.url, settings.supabase.secret_key)
        kid = client.table("kids").select("household_id").eq("id", kid_id).single().execute()
        if not kid.data or kid.data["household_id"] != user_id:
            raise HTTPException(status_code=403, detail="Kid does not belong to your household")

    try:
        details = await DailyAPI.create_room_and_tokens()
    except DailyAPIError as exc:
        logger.exception("Failed to create Daily room or tokens")
        raise HTTPException(status_code=503, detail="Failed to start Daily session.") from exc

    try:
        import modal  # type: ignore[import-untyped]

        await modal.Function.from_name(settings.modal.app_name, "run_bot_session").spawn.aio(
            room_url=str(details.url),
            token=details.bot_token,
            book_id=book_id,
            kid_id=kid_id,
        )
    except Exception as exc:
        logger.exception("Failed to launch Modal bot session")
        await DailyAPI.delete_room(details.name)
        raise HTTPException(status_code=503, detail="Failed to start bot session.") from exc

    return StartSessionResponse(room_url=str(details.url), token=details.user_token)
