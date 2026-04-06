from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from api.main import app
from tests.api.conftest import TEST_USER_ID

client = TestClient(app)


def _mock_kid_lookup():
    """Mock the Supabase kid ownership check to return a kid belonging to the test user."""
    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
        data={"household_id": TEST_USER_ID}
    )
    return patch("api.routers.start.create_client", return_value=mock_client)


def test_start_accepts_book_id_and_kid_id():
    with (
        patch("api.routers.start._start_via_bot_runner", new_callable=AsyncMock) as mock_runner,
        patch("api.routers.start.settings") as mock_settings,
        _mock_kid_lookup(),
    ):
        mock_runner.return_value = {"dailyRoom": "https://daily.co/room", "dailyToken": "tok"}
        mock_settings.pipecat_cloud.public_key = ""
        mock_settings.modal.app_name = ""
        mock_settings.bot.start_url = "http://bot:7860/start"

        resp = client.post("/start", json={"book_id": "book-1", "kid_id": "kid-1"})

    assert resp.status_code == 200


def test_start_works_without_params():
    with (
        patch("api.routers.start._start_via_bot_runner", new_callable=AsyncMock) as mock_runner,
        patch("api.routers.start.settings") as mock_settings,
    ):
        mock_runner.return_value = {"dailyRoom": "https://daily.co/room", "dailyToken": "tok"}
        mock_settings.pipecat_cloud.public_key = ""
        mock_settings.modal.app_name = ""
        mock_settings.bot.start_url = "http://bot:7860/start"

        resp = client.post("/start")

    assert resp.status_code == 200
