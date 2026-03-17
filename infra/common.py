from __future__ import annotations

import os
import tomllib
from dataclasses import dataclass
from pathlib import Path

import modal

ROOT_DIR = Path(__file__).resolve().parents[1]
REMOTE_ROOT = "/root/readme/server"
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


def _server_dependencies() -> list[str]:
    pyproject = tomllib.loads((ROOT_DIR / "server" / "pyproject.toml").read_text())
    return pyproject["project"]["dependencies"]


def _filter_deps(prefixes: list[str]) -> list[str]:
    """Return server dependencies matching any of the given prefixes."""
    all_deps = _server_dependencies()
    return [d for d in all_deps if any(d.lower().startswith(p) for p in prefixes)]


_COMMON_PREFIXES = ["loguru", "pydantic", "python-dotenv", "supabase"]
_API_PREFIXES = _COMMON_PREFIXES + ["fastapi", "uvicorn", "aiohttp", "tenacity"]
_BOT_PREFIXES = _COMMON_PREFIXES + ["pipecat", "aiortc"]
_WORKER_PREFIXES = _COMMON_PREFIXES + ["pymupdf", "google-genai", "tenacity"]


def bootstrap_infra_imports() -> None:
    """Ensure the repo root is on sys.path for both local and Modal containers."""
    import sys

    local_repo_root = Path(__file__).resolve().parent.parent
    remote_repo_root = Path(REMOTE_ROOT)
    for root in (local_repo_root, remote_repo_root):
        if (root / "infra").exists() and str(root) not in sys.path:
            sys.path.insert(0, str(root))


def bootstrap_repo() -> None:
    """Add the server directory to sys.path so imports match the local dev layout."""
    import sys

    if REMOTE_ROOT not in sys.path:
        sys.path.insert(0, REMOTE_ROOT)


ENV = os.getenv("ENV", "dev")
config = ModalConfig(env=ENV)

app = modal.App(config.app_name)
runtime_secret = modal.Secret.from_dict({"MODAL_APP_NAME": config.app_name})
secrets = [
    modal.Secret.from_name(config.secret_name),
    runtime_secret,
]

def _make_image(dep_prefixes: list[str]) -> modal.Image:
    return (
        modal.Image.debian_slim(python_version="3.13")
        .pip_install(*_filter_deps(dep_prefixes))
        .add_local_dir(
            str(ROOT_DIR / "server"),
            remote_path=REMOTE_ROOT,
            ignore=LOCAL_DIR_IGNORE,
        )
    )


api_image = _make_image(_API_PREFIXES)
bot_image = _make_image(_BOT_PREFIXES)
worker_image = _make_image(_WORKER_PREFIXES)
