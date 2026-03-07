import json
from functools import lru_cache
from typing import Any

from loguru import logger
from redis import Redis
from redis.exceptions import RedisError

try:
    from shared.config import APP_REDIS_URL
except ImportError:
    from server.shared.config import APP_REDIS_URL  # type: ignore


DEFAULT_CALL_STATE_TTL_SECONDS = 60 * 60


def _state_key(session_id: str) -> str:
    return f"call:{session_id}:state"


@lru_cache(maxsize=1)
def _redis_client() -> Redis:
    if not APP_REDIS_URL:
        raise RuntimeError("APP_REDIS_URL is required for shared call state.")
    return Redis.from_url(APP_REDIS_URL, decode_responses=True)


def set_call_state(
    session_id: str,
    state: dict[str, Any],
    ttl_seconds: int = DEFAULT_CALL_STATE_TTL_SECONDS,
) -> bool:
    if not session_id.strip():
        raise ValueError("session_id is required.")

    try:
        payload = json.dumps(state)
        _redis_client().set(
            name=_state_key(session_id),
            value=payload,
            ex=ttl_seconds,
        )
        return True
    except (TypeError, ValueError):
        logger.exception("Call state is not JSON-serializable | session_id={}", session_id)
        return False
    except RedisError:
        logger.exception("Failed to write call state | session_id={}", session_id)
        return False


def get_call_state(session_id: str) -> dict[str, Any] | None:
    if not session_id.strip():
        raise ValueError("session_id is required.")

    try:
        payload = _redis_client().get(_state_key(session_id))
        if payload is None:
            return None
        data = json.loads(str(payload))
        if not isinstance(data, dict):
            logger.warning("Call state payload is not an object | session_id={}", session_id)
            return None
        return data
    except json.JSONDecodeError:
        logger.exception("Failed to decode call state JSON | session_id={}", session_id)
        return None
    except RedisError:
        logger.exception("Failed to read call state | session_id={}", session_id)
        return None


def delete_call_state(session_id: str) -> bool:
    if not session_id.strip():
        raise ValueError("session_id is required.")

    try:
        _redis_client().delete(_state_key(session_id))
        return True
    except RedisError:
        logger.exception("Failed to delete call state | session_id={}", session_id)
        return False
