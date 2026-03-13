"""Shared Gemini client and retry helpers for the PDF pipeline."""

from __future__ import annotations

from functools import cache
from typing import TypeVar, cast, get_origin

from google.genai import Client, types
from loguru import logger
from pydantic import BaseModel
from tenacity import Retrying, retry_if_exception, stop_after_attempt, wait_exponential_jitter

try:
    from shared.config import GOOGLE_API_KEY
except ImportError:
    from server.shared.config import GOOGLE_API_KEY  # type: ignore

LLM_MODEL = "gemini-2.5-flash"
MAX_RETRIES = 6

T = TypeVar("T")


def is_quota_error(error: Exception) -> bool:
    message = str(error).upper()
    return "429" in message or "RESOURCE_EXHAUSTED" in message


@cache
def get_client() -> Client:
    return Client(api_key=GOOGLE_API_KEY)


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
            check_type = get_origin(result_type) or result_type
            if response.parsed is None or not isinstance(response.parsed, check_type):
                raise RuntimeError(f"Gemini returned invalid structure: {response.text}")
            return cast(T, response.parsed)
    raise RuntimeError("Gemini retry loop exhausted.")
