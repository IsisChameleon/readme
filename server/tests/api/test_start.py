import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

# Provide a fake modal module so `import modal` inside start_session works
_mock_modal = ModuleType("modal")
_mock_modal.Function = MagicMock()
sys.modules.setdefault("modal", _mock_modal)

from fastapi.testclient import TestClient

import api.routers.start as start
from api.main import app
from api.services.daily import DailyRoomDetails

# ── Local dev path (no MODAL_APP_NAME) ───────────────────────────────


def test_start_local_proxies_to_bot() -> None:
    client = TestClient(app)
    bot_response = {"dailyRoom": "https://daily.example/room", "dailyToken": "user-token"}

    with patch.object(start, "_start_via_bot_runner", AsyncMock(return_value=bot_response)):
        response = client.post("/start")

    assert response.status_code == 200
    assert response.json() == {"room_url": "https://daily.example/room", "token": "user-token"}


def test_start_local_returns_503_when_bot_unreachable() -> None:
    import aiohttp

    client = TestClient(app)

    with (
        patch.object(
            start,
            "_start_via_bot_runner",
            AsyncMock(side_effect=aiohttp.ClientError("connection refused")),
        ),
        patch.object(start.logger, "exception"),
    ):
        response = client.post("/start")

    assert response.status_code == 503
    assert response.json()["detail"] == "Bot service unavailable."


# ── Modal path (MODAL_APP_NAME set) ─────────────────────────────────


def _patch_modal():
    return patch.object(start.settings.modal, "app_name", "test-app")


def test_start_modal_returns_room_url_and_user_token() -> None:
    client = TestClient(app)
    details = DailyRoomDetails(
        url="https://daily.example/readme-room",
        name="readme-room",
        bot_token="bot-token",
        user_token="user-token",
    )

    mock_fn = MagicMock()
    _mock_modal.Function.from_name.return_value = mock_fn
    with (
        _patch_modal(),
        patch.object(start.DailyAPI, "create_room_and_tokens", AsyncMock(return_value=details)),
    ):
        response = client.post("/start")

    assert response.status_code == 200
    assert response.json() == {
        "room_url": "https://daily.example/readme-room",
        "token": "user-token",
    }
    mock_fn.spawn.assert_called_once_with(
        room_url="https://daily.example/readme-room",
        token="bot-token",
    )


def test_start_modal_returns_503_when_daily_fails() -> None:
    client = TestClient(app)

    with (
        _patch_modal(),
        patch.object(
            start.DailyAPI,
            "create_room_and_tokens",
            AsyncMock(side_effect=start.DailyAPIError("daily down")),
        ),
        patch.object(start.logger, "exception"),
    ):
        response = client.post("/start")

    assert response.status_code == 503
    assert response.json()["detail"] == "Failed to start Daily session."


def test_start_modal_returns_503_and_cleans_up_room_when_bot_launch_fails() -> None:
    client = TestClient(app)
    details = DailyRoomDetails(
        url="https://daily.example/readme-room",
        name="readme-room",
        bot_token="bot-token",
        user_token="user-token",
    )

    mock_fn = MagicMock()
    mock_fn.spawn.side_effect = RuntimeError("spawn failed")
    _mock_modal.Function.from_name.return_value = mock_fn
    with (
        _patch_modal(),
        patch.object(start.DailyAPI, "create_room_and_tokens", AsyncMock(return_value=details)),
        patch.object(start.DailyAPI, "delete_room", AsyncMock()) as delete_room_mock,
        patch.object(start.logger, "exception"),
    ):
        response = client.post("/start")

    assert response.status_code == 503
    assert response.json()["detail"] == "Failed to start bot session."
    delete_room_mock.assert_awaited_once_with("readme-room")
