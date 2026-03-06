import json
import sys
from pathlib import Path
from unittest.mock import Mock, patch

from redis.exceptions import RedisError

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from server.shared import call_state


def test_set_call_state_writes_json_with_ttl() -> None:
    mock_redis = Mock()
    with patch.object(call_state, "_redis_client", return_value=mock_redis):
        ok = call_state.set_call_state(
            session_id="session-123",
            state={"participant_id": "kid-1", "status": "reading"},
            ttl_seconds=120,
        )

    assert ok is True
    mock_redis.set.assert_called_once()
    set_kwargs = mock_redis.set.call_args.kwargs
    assert set_kwargs["name"] == "call:session-123:state"
    assert set_kwargs["ex"] == 120
    assert json.loads(set_kwargs["value"]) == {
        "participant_id": "kid-1",
        "status": "reading",
    }


def test_get_call_state_returns_dict_when_present() -> None:
    mock_redis = Mock()
    mock_redis.get.return_value = '{"chapter":"3","position":"42"}'

    with patch.object(call_state, "_redis_client", return_value=mock_redis):
        payload = call_state.get_call_state("session-xyz")

    assert payload == {"chapter": "3", "position": "42"}
    mock_redis.get.assert_called_once_with("call:session-xyz:state")


def test_get_call_state_returns_none_for_invalid_json() -> None:
    mock_redis = Mock()
    mock_redis.get.return_value = "{not-json"

    with (
        patch.object(call_state, "_redis_client", return_value=mock_redis),
        patch.object(call_state.logger, "exception"),
    ):
        payload = call_state.get_call_state("session-xyz")

    assert payload is None


def test_delete_call_state_deletes_key() -> None:
    mock_redis = Mock()
    with patch.object(call_state, "_redis_client", return_value=mock_redis):
        ok = call_state.delete_call_state("session-to-delete")

    assert ok is True
    mock_redis.delete.assert_called_once_with("call:session-to-delete:state")


def test_set_call_state_returns_false_on_redis_error() -> None:
    mock_redis = Mock()
    mock_redis.set.side_effect = RedisError("redis down")

    with (
        patch.object(call_state, "_redis_client", return_value=mock_redis),
        patch.object(call_state.logger, "exception"),
    ):
        ok = call_state.set_call_state("session-1", {"foo": "bar"})

    assert ok is False
