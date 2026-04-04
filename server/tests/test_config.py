"""Tests for LazySecretsSettings env var resolution."""

import os

import pytest
from pydantic import field_validator

from shared.config import LazySecretsSettings


class SimpleSettings(LazySecretsSettings):
    api_key: str = "${TEST_API_KEY}"
    plain: str = "no-env-ref"


class ListSettings(LazySecretsSettings):
    origins: list[str] = ["http://localhost"]

    @field_validator("origins", mode="before")
    @classmethod
    def parse_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


class TestEnvVarResolution:
    """${ENV_VAR} strings should resolve to the env var value."""

    def test_resolves_env_var(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("TEST_API_KEY", "sk-secret-123")
        s = SimpleSettings()
        assert s.api_key == "sk-secret-123"

    def test_missing_env_var_returns_empty(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("TEST_API_KEY", raising=False)
        s = SimpleSettings()
        assert s.api_key == ""

    def test_plain_string_unchanged(self) -> None:
        s = SimpleSettings()
        assert s.plain == "no-env-ref"


class TestListResolution:
    """Comma-separated env var strings should become list[str]."""

    def test_single_origin_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("MY_ORIGINS", "https://dev.example.com")
        s = ListSettings(origins="${MY_ORIGINS}")
        assert s.origins == ["https://dev.example.com"]

    def test_multiple_origins_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("MY_ORIGINS", "https://dev.example.com,https://app.example.com")
        s = ListSettings(origins="${MY_ORIGINS}")
        assert s.origins == ["https://dev.example.com", "https://app.example.com"]

    def test_multiple_origins_with_spaces(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("MY_ORIGINS", "https://dev.example.com , https://app.example.com")
        s = ListSettings(origins="${MY_ORIGINS}")
        assert s.origins == ["https://dev.example.com", "https://app.example.com"]

    def test_missing_env_var_for_list_returns_empty(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("MY_ORIGINS", raising=False)
        s = ListSettings(origins="${MY_ORIGINS}")
        assert s.origins == []

    def test_explicit_list_unchanged(self) -> None:
        s = ListSettings(origins=["https://a.com", "https://b.com"])
        assert s.origins == ["https://a.com", "https://b.com"]

    def test_default_value_used(self) -> None:
        s = ListSettings()
        assert s.origins == ["http://localhost"]
