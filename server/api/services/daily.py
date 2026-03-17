from __future__ import annotations

from functools import lru_cache
from time import time
from uuid import uuid4

import aiohttp
from pydantic import BaseModel, HttpUrl

from shared.config import settings


class DailyAPIError(RuntimeError):
    """Raised when the Daily REST API returns an error."""


class DailyRoomDetails(BaseModel):
    url: HttpUrl
    name: str
    bot_token: str
    user_token: str


class DailyAPI:
    """Daily.co API wrapper for room and token management."""

    @staticmethod
    @lru_cache(maxsize=1)
    def _http() -> aiohttp.ClientSession:
        if not settings.daily.api_key:
            raise DailyAPIError("DAILY_API_KEY is required.")
        return aiohttp.ClientSession(
            headers={"Authorization": f"Bearer {settings.daily.api_key}"},
            timeout=aiohttp.ClientTimeout(total=20),
        )

    @staticmethod
    async def _request(method: str, path: str, payload: dict | None = None) -> dict:
        session = DailyAPI._http()
        url = f"{settings.daily.api_base_url}{path}"
        async with session.request(method, url, json=payload) as response:
            data = await response.json(content_type=None)
            if response.status >= 400:
                raise DailyAPIError(f"Daily API {method} {path} failed: {response.status} {data}")
            if not isinstance(data, dict):
                raise DailyAPIError(f"Daily API {method} {path} returned invalid payload.")
            return data

    @staticmethod
    async def _create_token(room_name: str, user_name: str, is_owner: bool) -> str:
        payload = {
            "properties": {
                "room_name": room_name,
                "user_name": user_name,
                "is_owner": is_owner,
                "eject_at_token_exp": True,
                "exp": int(time()) + settings.daily.room_ttl_seconds,
            }
        }
        data = await DailyAPI._request("POST", "/meeting-tokens", payload)
        token = data.get("token")
        if not isinstance(token, str) or not token:
            raise DailyAPIError("Daily API did not return a token.")
        return token

    @staticmethod
    async def create_room_and_tokens(
        user_name: str = "reader",
        bot_name: str = "readme-bot",
    ) -> DailyRoomDetails:
        room_name = f"readme-{uuid4().hex}"
        room_payload = {
            "name": room_name,
            "privacy": "private",
            "properties": {
                "exp": int(time()) + settings.daily.room_ttl_seconds,
                "eject_at_room_exp": True,
            },
        }
        room = await DailyAPI._request("POST", "/rooms", room_payload)
        room_url = room.get("url")
        if not isinstance(room_url, str) or not room_url:
            raise DailyAPIError("Daily room creation did not return a room URL.")

        bot_token = await DailyAPI._create_token(room_name, bot_name, is_owner=True)
        user_token = await DailyAPI._create_token(room_name, user_name, is_owner=False)
        return DailyRoomDetails(
            url=room_url,
            name=room_name,
            bot_token=bot_token,
            user_token=user_token,
        )

    @staticmethod
    async def delete_room(room_name: str) -> None:
        try:
            await DailyAPI._request("DELETE", f"/rooms/{room_name}")
        except DailyAPIError as exc:
            if " 404 " not in str(exc):
                raise

    @staticmethod
    async def shutdown() -> None:
        if DailyAPI._http.cache_info().currsize == 0:
            return

        session = DailyAPI._http()
        if not session.closed:
            await session.close()
        DailyAPI._http.cache_clear()
