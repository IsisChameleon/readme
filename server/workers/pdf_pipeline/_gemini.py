"""Shared Gemini client and retry helpers for the PDF pipeline."""

from __future__ import annotations

from functools import cache
from typing import TypeVar, cast

from google.genai import Client, types
from pydantic import BaseModel
from tenacity import Retrying, retry_if_exception, stop_after_attempt, wait_exponential_jitter

from shared.config import settings

LLM_MODEL = "gemini-2.5-flash"
MAX_RETRIES = 6

T = TypeVar("T")


def is_quota_error(error: Exception) -> bool:
    message = str(error).upper()
    return "429" in message or "RESOURCE_EXHAUSTED" in message


@cache
def get_client() -> Client:
    return Client(api_key=settings.keys.google_api_key)


def _make_retryer() -> Retrying:
    return Retrying(
        retry=retry_if_exception(is_quota_error),
        stop=stop_after_attempt(MAX_RETRIES + 1),
        wait=wait_exponential_jitter(initial=2, max=60, jitter=3),
        reraise=True,
    )


def generate_text(prompt: str | list[types.Part | str]) -> str:
    """Call Gemini and return raw text. Retries on quota errors."""
    client = get_client()
    contents = [prompt] if isinstance(prompt, str) else prompt
    for attempt in _make_retryer():
        with attempt:
            response = client.models.generate_content(
                model=LLM_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(temperature=0.0),
            )
            return response.text or ""
    raise RuntimeError("Gemini retry loop exhausted.")


def generate_structured(
    prompt: str | list[types.Part | str],
    result_type: type[T],
) -> T:
    """Call Gemini with structured JSON output. Retries on quota errors."""
    client = get_client()
    contents = [prompt] if isinstance(prompt, str) else prompt
    for attempt in _make_retryer():
        with attempt:
            response = client.models.generate_content(
                model=LLM_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                    response_schema=result_type,
                ),
            )
            if response.parsed is not None and isinstance(response.parsed, result_type):
                return cast(T, response.parsed)
            # Gemini may return a raw dict; validate through Pydantic
            raw = response.text or ""
            if not raw:
                raise RuntimeError("Gemini returned empty response")
            if issubclass(result_type, BaseModel):
                return cast(T, result_type.model_validate_json(raw))
            raise RuntimeError(f"Gemini returned invalid structure: {raw}")
    raise RuntimeError("Gemini retry loop exhausted.")
