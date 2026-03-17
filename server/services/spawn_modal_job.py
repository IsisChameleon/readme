from __future__ import annotations

from typing import Any


def spawn_modal_job(function_name: str, *args: Any, **kwargs: Any) -> None:
    """Spawn a Modal function by name. Only works when MODAL_APP_NAME is configured."""
    import modal

    from shared.config import settings

    modal.Function.from_name(settings.modal.app_name, function_name).spawn(*args, **kwargs)
