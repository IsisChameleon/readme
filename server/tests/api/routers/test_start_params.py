from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_start_accepts_book_id_and_kid_id():
    with patch("api.routers.start._start_via_bot_runner", new_callable=AsyncMock) as mock_runner:
        mock_runner.return_value = {"dailyRoom": "https://daily.co/room", "dailyToken": "tok"}
        with patch("api.routers.start.settings") as mock_settings:
            mock_settings.modal.app_name = ""
            mock_settings.bot.start_url = "http://bot:7860/start"

            resp = client.post("/start", json={"book_id": "book-1", "kid_id": "kid-1"})

    assert resp.status_code == 200


def test_start_works_without_params():
    with patch("api.routers.start._start_via_bot_runner", new_callable=AsyncMock) as mock_runner:
        mock_runner.return_value = {"dailyRoom": "https://daily.co/room", "dailyToken": "tok"}
        with patch("api.routers.start.settings") as mock_settings:
            mock_settings.modal.app_name = ""
            mock_settings.bot.start_url = "http://bot:7860/start"

            resp = client.post("/start")

    assert resp.status_code == 200
