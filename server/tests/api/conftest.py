"""Shared fixtures for API tests."""

import pytest

from api.deps import get_authenticated_user_id
from api.main import app

TEST_USER_ID = "test-user-id"


@pytest.fixture(autouse=True)
def _bypass_auth():
    """Override auth dependency so tests don't need a real Supabase token."""
    app.dependency_overrides[get_authenticated_user_id] = lambda: TEST_USER_ID
    yield
    app.dependency_overrides.pop(get_authenticated_user_id, None)
