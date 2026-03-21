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


def _dereference_schema(schema: dict) -> dict:
    """Inline all $defs/$ref so Gemini gets a flat schema it can understand."""
    defs = schema.pop("$defs", {})

    def _resolve(obj: object) -> object:
        if isinstance(obj, dict):
            if "$ref" in obj:
                ref_name = obj["$ref"].rsplit("/", 1)[-1]
                return _resolve(defs[ref_name])
            return {k: _resolve(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_resolve(item) for item in obj]
        return obj

    return _resolve(schema)


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

    # Build a flat JSON schema (no $ref) for Gemini's response_schema parameter
    schema = None
    if issubclass(result_type, BaseModel):
        schema = _dereference_schema(result_type.model_json_schema())

    for attempt in _make_retryer():
        with attempt:
            response = client.models.generate_content(
                model=LLM_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    response_mime_type="application/json",
                    response_schema=schema if schema else result_type,
                    max_output_tokens=65536,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )
            raw = response.text or ""
            if not raw:
                raise RuntimeError("Gemini returned empty response")
            if issubclass(result_type, BaseModel):
                return cast(T, result_type.model_validate_json(raw))
            raise RuntimeError(f"Gemini returned invalid structure: {raw}")
    raise RuntimeError("Gemini retry loop exhausted.")
