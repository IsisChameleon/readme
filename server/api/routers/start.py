from __future__ import annotations

import aiohttp
from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel

from api.services.daily import DailyAPI, DailyAPIError
from shared.config import settings

router = APIRouter(tags=["voice"])


class StartSessionResponse(BaseModel):
    room_url: str
    token: str


async def _start_via_bot_runner(bot_url: str) -> dict:
    """Forward to the Pipecat bot runner, which creates the Daily room and runs the bot."""
    async with aiohttp.ClientSession() as session:
        async with session.post(
            bot_url,
            json={"createDailyRoom": True},
            headers={"Content-Type": "application/json"},
        ) as resp:
            if resp.status >= 400:
                body = await resp.text()
                raise HTTPException(status_code=resp.status, detail=f"Bot /start failed: {body}")
            return await resp.json()


@router.post("/start", response_model=StartSessionResponse)
async def start_session() -> StartSessionResponse:
    if not settings.modal.app_name:
        # No Modal configured — use the bot runner directly
        bot_url = settings.bot.start_url
        try:
            data = await _start_via_bot_runner(bot_url)
        except aiohttp.ClientError as exc:
            logger.exception("Failed to reach bot at {}", bot_url)
            raise HTTPException(status_code=503, detail="Bot service unavailable.") from exc
        return StartSessionResponse(room_url=data["dailyRoom"], token=data["dailyToken"])

    # Modal configured — create room via Daily API + spawn bot on Modal
    try:
        details = await DailyAPI.create_room_and_tokens()
    except DailyAPIError as exc:
        logger.exception("Failed to create Daily room or tokens")
        raise HTTPException(status_code=503, detail="Failed to start Daily session.") from exc

    try:
        import modal  # type: ignore[import-untyped]

        modal.Function.from_name(settings.modal.app_name, "run_bot_session").spawn(
            room_url=str(details.url),
            token=details.bot_token,
        )
    except Exception as exc:
        logger.exception("Failed to launch Modal bot session")
        await DailyAPI.delete_room(details.name)
        raise HTTPException(status_code=503, detail="Failed to start bot session.") from exc

    return StartSessionResponse(room_url=str(details.url), token=details.user_token)
