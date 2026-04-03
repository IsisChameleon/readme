from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from api.main import app
from tests.api.conftest import TEST_USER_ID

client = TestClient(app)


def test_create_kid_success():
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": "kid-1",
            "household_id": TEST_USER_ID,
            "name": "Emma",
            "avatar": "E",
            "color": "#F472B6",
        }
    ]

    with patch("api.routers.kids._supabase_client") as mock_sb:
        mock_client = MagicMock()
        mock_sb.return_value = mock_client
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_response
        resp = client.post(
            "/kids",
            json={
                "household_id": TEST_USER_ID,
                "name": "Emma",
                "avatar": "E",
                "color": "#F472B6",
            },
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Emma"
    assert data["household_id"] == TEST_USER_ID


def test_create_kid_missing_name():
    resp = client.post(
        "/kids",
        json={
            "household_id": TEST_USER_ID,
            "name": "",
        },
    )
    assert resp.status_code == 422


def test_create_kid_missing_household():
    resp = client.post(
        "/kids",
        json={
            "name": "Emma",
        },
    )
    assert resp.status_code == 422


def test_create_kid_wrong_household_returns_403():
    resp = client.post(
        "/kids",
        json={
            "household_id": "someone-elses-household",
            "name": "Emma",
        },
    )
    assert resp.status_code == 403
