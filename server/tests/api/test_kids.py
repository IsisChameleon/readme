from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_create_kid_success():
    mock_response = MagicMock()
    mock_response.data = [
        {"id": "kid-1", "household_id": "h-1", "name": "Emma", "avatar": "E", "color": "#F472B6"}
    ]

    with patch("api.routers.kids._supabase_client") as mock_sb:
        mock_client = MagicMock()
        mock_sb.return_value = mock_client
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_response
        resp = client.post(
            "/kids",
            json={
                "household_id": "h-1",
                "name": "Emma",
                "avatar": "E",
                "color": "#F472B6",
            },
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Emma"
    assert data["household_id"] == "h-1"


def test_create_kid_missing_name():
    resp = client.post(
        "/kids",
        json={
            "household_id": "h-1",
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
