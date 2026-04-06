from __future__ import annotations

import aiohttp
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


class StartSessionResponse(BaseModel):
    room_url: str
    token: str


class StartSessionRequest(BaseModel):
    book_id: str | None = None
    kid_id: str | None = None


async def _start_via_pcc(book_id: str | None = None, kid_id: str | None = None) -> dict:
    """Forward to Pipecat Cloud's public /start endpoint."""
    pcc = settings.pipecat_cloud
    url = f"{pcc.api_base_url}/public/{pcc.agent_name}/start"

    body: dict = {
        "createDailyRoom": True,
        "body": {"book_id": book_id, "kid_id": kid_id},
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            url,
            json=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {pcc.public_key}",
            },
        ) as resp:
            if resp.status >= 400:
                body_text = await resp.text()
                raise HTTPException(
                    status_code=resp.status, detail=f"PCC /start failed: {body_text}"
                )
            return await resp.json()


async def _start_via_bot_runner(
    bot_url: str, book_id: str | None = None, kid_id: str | None = None
) -> dict:
    """Forward to the Pipecat bot runner, which creates the Daily room and runs the bot."""
    body: dict = {
        "createDailyRoom": True,
        "body": {"book_id": book_id, "kid_id": kid_id},
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            bot_url,
            json=body,
            headers={"Content-Type": "application/json"},
        ) as resp:
            if resp.status >= 400:
                body_text = await resp.text()
                raise HTTPException(
                    status_code=resp.status, detail=f"Bot /start failed: {body_text}"
                )
            return await resp.json()


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

    # Priority: Pipecat Cloud > Modal > local bot runner
    if settings.pipecat_cloud.public_key:
        try:
            data = await _start_via_pcc(book_id, kid_id)
        except aiohttp.ClientError as exc:
            logger.exception("Failed to reach Pipecat Cloud")
            raise HTTPException(status_code=503, detail="Bot service unavailable.") from exc
        return StartSessionResponse(room_url=data["dailyRoom"], token=data["dailyToken"])

    if settings.modal.app_name:
        # DEPRECATED: Modal bot sessions — kept as fallback
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

    # Local bot runner (docker-compose dev)
    bot_url = settings.bot.start_url
    try:
        data = await _start_via_bot_runner(bot_url, book_id, kid_id)
    except aiohttp.ClientError as exc:
        logger.exception("Failed to reach bot at {}", bot_url)
        raise HTTPException(status_code=503, detail="Bot service unavailable.") from exc
    return StartSessionResponse(room_url=data["dailyRoom"], token=data["dailyToken"])
