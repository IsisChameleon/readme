from __future__ import annotations

from typing import Any


def spawn_modal_job(function_name: str, *args: Any, **kwargs: Any) -> None:
    """Spawn a Modal function by name. Only works when MODAL_APP_NAME is configured."""
    import modal

    try:
        from shared.config import settings
    except ImportError:
        from server.shared.config import settings  # type: ignore

    modal.Function.from_name(settings.modal.app_name, function_name).spawn(*args, **kwargs)
