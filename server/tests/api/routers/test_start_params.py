import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

# Provide a fake modal module
_mock_modal = sys.modules.get("modal")
if not _mock_modal:
    _mock_modal = ModuleType("modal")
    _mock_modal.Function = MagicMock()
    sys.modules["modal"] = _mock_modal

from fastapi.testclient import TestClient

import api.routers.start as start
from api.main import app
from api.services.daily import DailyRoomDetails
from tests.api.conftest import TEST_USER_ID

client = TestClient(app)


def _mock_kid_lookup():
    """Mock the Supabase kid ownership check to return a kid belonging to the test user."""
    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"household_id": TEST_USER_ID}
    )
    return patch("api.routers.start.create_client", return_value=mock_client)


def _mock_modal_spawn():
    details = DailyRoomDetails(
        url="https://daily.co/room",
        name="room",
        bot_token="bot-tok",
        user_token="user-tok",
    )
    mock_fn = MagicMock()
    mock_fn.spawn.aio = AsyncMock()
    _mock_modal.Function.from_name.return_value = mock_fn
    return (
        patch.object(start.settings.modal, "app_name", "test-app"),
        patch.object(start.DailyAPI, "create_room_and_tokens", AsyncMock(return_value=details)),
    )


def test_start_accepts_book_id_and_kid_id():
    modal_app, daily_mock = _mock_modal_spawn()
    with modal_app, daily_mock, _mock_kid_lookup():
        resp = client.post("/start", json={"book_id": "book-1", "kid_id": "kid-1"})

    assert resp.status_code == 200


def test_start_works_without_params():
    modal_app, daily_mock = _mock_modal_spawn()
    with modal_app, daily_mock:
        resp = client.post("/start")

    assert resp.status_code == 200
