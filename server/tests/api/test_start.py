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

# ── Modal path ─────────────────────────────────────────────────


def _setup_modal_mock():
    """Reset and configure the modal mock. Returns (patch_context, mock_fn)."""
    mock_fn = MagicMock()
    mock_fn.spawn.aio = AsyncMock()
    mock_modal = ModuleType("modal")
    mock_modal.Function = MagicMock()
    mock_modal.Function.from_name.return_value = mock_fn
    return (
        patch.object(start.settings.modal, "app_name", "test-app"),
        patch.dict(sys.modules, {"modal": mock_modal}),
        mock_fn,
    )


def test_start_modal_returns_room_url_and_user_token() -> None:
    client = TestClient(app)
    details = DailyRoomDetails(
        url="https://daily.example/readme-room",
        name="readme-room",
        bot_token="bot-token",
        user_token="user-token",
    )

    patch_modal, patch_module, mock_fn = _setup_modal_mock()
    with (
        patch_modal,
        patch_module,
        patch.object(start.DailyAPI, "create_room_and_tokens", AsyncMock(return_value=details)),
    ):
        response = client.post("/start")

    assert response.status_code == 200
    assert response.json() == {
        "room_url": "https://daily.example/readme-room",
        "token": "user-token",
    }
    mock_fn.spawn.aio.assert_called_once_with(
        room_url="https://daily.example/readme-room",
        token="bot-token",
        book_id=None,
        kid_id=None,
    )


def test_start_modal_returns_503_when_daily_fails() -> None:
    client = TestClient(app)
    patch_modal, patch_module, _ = _setup_modal_mock()

    with (
        patch_modal,
        patch_module,
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

    patch_modal, patch_module, mock_fn = _setup_modal_mock()
    mock_fn.spawn.aio = AsyncMock(side_effect=RuntimeError("spawn failed"))
    with (
        patch_modal,
        patch_module,
        patch.object(start.DailyAPI, "create_room_and_tokens", AsyncMock(return_value=details)),
        patch.object(start.DailyAPI, "delete_room", AsyncMock()) as delete_room_mock,
        patch.object(start.logger, "exception"),
    ):
        response = client.post("/start")

    assert response.status_code == 503
    assert response.json()["detail"] == "Failed to start bot session."
    delete_room_mock.assert_awaited_once_with("readme-room")
