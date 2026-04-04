from __future__ import annotations

import os
from pathlib import Path

from pydantic import BaseModel, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings.main import PydanticBaseSettingsSource, TomlConfigSettingsSource


class LazySecretsSettings(BaseModel):
    """BaseModel subclass that resolves ${ENV_VAR} references.

    Resolution happens in two stages:
    - model_validator(mode="before"): resolves values passed to the constructor
      (e.g. from TOML settings). Runs before field validators, so comma-separated
      strings can be split into lists by downstream validators.
    - model_post_init: resolves class-level defaults (e.g. api_key = "${MY_KEY}")
      that aren't in the input data.
    """

    @staticmethod
    def _resolve(value: str) -> str:
        if value.startswith("${") and value.endswith("}"):
            return os.getenv(value[2:-1], "")
        return value

    @model_validator(mode="before")
    @classmethod
    def resolve_env_vars(cls, data: dict) -> dict:
        if not isinstance(data, dict):
            return data
        for key, value in data.items():
            if isinstance(value, str):
                data[key] = cls._resolve(value)
        return data

    def model_post_init(self, __context: object) -> None:
        for name, _field in type(self).model_fields.items():
            value = object.__getattribute__(self, name)
            if isinstance(value, str):
                resolved = self._resolve(value)
                if resolved is not value:
                    object.__setattr__(self, name, resolved)


class SupabaseSettings(LazySecretsSettings):
    url: str = ""
    secret_key: str = "${SUPABASE_SECRET_KEY}"
    books_bucket: str = "readme_dev"


class DailySettings(LazySecretsSettings):
    api_key: str = "${DAILY_API_KEY}"
    api_base_url: str = "https://api.daily.co/v1"
    room_ttl_seconds: int = 1800


class KeysSettings(LazySecretsSettings):
    google_api_key: str = "${GOOGLE_API_KEY}"
    openai_api_key: str = "${OPENAI_API_KEY}"
    deepgram_api_key: str = "${DEEPGRAM_API_KEY}"
    cartesia_api_key: str = "${CARTESIA_API_KEY}"


class BotSettings(BaseModel):
    start_url: str = "http://bot:7860/start"


class ModalSettings(LazySecretsSettings):
    app_name: str = ""


class UploadSettings(BaseModel):
    max_bytes: int = 25 * 1024 * 1024


class CorsSettings(LazySecretsSettings):
    allowed_origins: list[str] = ["http://localhost:3000"]
    allowed_origin_regex: str = ""

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            if not v:
                return ["http://localhost:3000"]
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


_TOML_PATH = Path(__file__).resolve().parent.parent / "settings.toml"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        toml_file=_TOML_PATH,
        extra="ignore",
    )

    supabase: SupabaseSettings = SupabaseSettings()
    daily: DailySettings = DailySettings()
    keys: KeysSettings = KeysSettings()
    bot: BotSettings = BotSettings()
    modal: ModalSettings = ModalSettings()
    upload: UploadSettings = UploadSettings()
    cors: CorsSettings = CorsSettings()

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        return (
            init_settings,
            env_settings,
            TomlConfigSettingsSource(settings_cls),
        )


settings = Settings()
