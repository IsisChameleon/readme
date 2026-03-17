from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass
from pathlib import Path

import modal

LOCAL_INFRA_DIR = Path(__file__).resolve().parent
LOCAL_SERVER_DIR = LOCAL_INFRA_DIR.parent / "server"
REMOTE_SERVER_DIR = "/root/server"
LOCAL_DIR_IGNORE = [
    ".venv/**",
    "__pycache__/**",
    ".pytest_cache/**",
    ".ruff_cache/**",
    ".mypy_cache/**",
    "*.pyc",
    ".DS_Store",
]


@dataclass(frozen=True)
class ModalConfig:
    env: str
    region: str = "us-west"

    @property
    def app_name(self) -> str:
        return f"readme-{self.env}"

    @property
    def secret_name(self) -> str:
        return f"readme-{self.env}"


def _image_dependencies(group: str) -> list[str]:
    """Return common + group-specific deps from server/pyproject.toml optional-dependencies."""
    pyproject = tomllib.loads((LOCAL_SERVER_DIR / "pyproject.toml").read_text())
    extras = pyproject["project"]["optional-dependencies"]
    return extras.get("common", []) + extras.get(group, [])


def bootstrap_infra_imports() -> None:
    """Add the project root to sys.path so ``import infra.*`` works."""
    import sys

    project_root = str(LOCAL_INFRA_DIR.parent)
    if project_root not in sys.path:
        sys.path.insert(0, project_root)


def bootstrap_repo() -> None:
    """Add the server directory to sys.path so server-relative imports work."""
    import sys

    server_dir = str(LOCAL_SERVER_DIR)
    if server_dir not in sys.path:
        sys.path.insert(0, server_dir)


ENV = os.getenv("ENV", "dev")
config = ModalConfig(env=ENV)

app = modal.App(config.app_name)
runtime_secret = modal.Secret.from_dict({"MODAL_APP_NAME": config.app_name})
secrets = [
    modal.Secret.from_name(config.secret_name),
    runtime_secret,
]


def _make_image(group: str) -> modal.Image:
    return (
        modal.Image.debian_slim(python_version="3.13")
        .pip_install(*_image_dependencies(group))
        .add_local_dir(
            str(LOCAL_SERVER_DIR),
            remote_path=REMOTE_SERVER_DIR,
            ignore=LOCAL_DIR_IGNORE,
        )
    )


api_image = _make_image("api")
bot_image = _make_image("bot")
worker_image = _make_image("worker")
