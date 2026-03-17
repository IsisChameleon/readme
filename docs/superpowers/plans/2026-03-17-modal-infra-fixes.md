# Modal Infrastructure Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix issues in the AI-generated Modal infrastructure so local dev stays working and the Modal production path matches the spec.

**Architecture:** Two deployment paths: local dev (docker-compose, Pipecat runner) and production (Modal for API/bot/worker, Daily for WebRTC). `infra/` defines Modal containers; `server/` has app code. They never cross-import. Config refactor, CORS, and /start dual-path are already done and tested locally (uncommitted).

**Tech Stack:** Python 3.13, FastAPI, pydantic-settings, Modal, Pipecat, Daily.co, Next.js, Docker Compose

**Spec:** `docs/superpowers/specs/2026-03-14-modal-infrastructure-design.md`

---

## Chunk 1: Fix infra code quality

### Task 1: Extract duplicated `_spawn_modal_job` into shared module

`_spawn_modal_job` is defined in both `server/api/start.py` (with `**kwargs`) and `server/api/admin.py` (with `*args`). Extract to a single location.

**Files:**
- Create: `server/services/spawn_modal_job.py`
- Modify: `server/api/start.py` — remove local definition, import shared
- Modify: `server/api/admin.py` — remove local definition, import shared

- [ ] **Step 1: Create shared module**

```python
# server/services/spawn_modal_job.py
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
```

- [ ] **Step 2: Update `server/api/start.py`**

Remove the `_spawn_modal_job` function. Add import:
```python
try:
    from services.spawn_modal_job import spawn_modal_job
except ImportError:
    from server.services.spawn_modal_job import spawn_modal_job  # type: ignore
```

Replace `_spawn_modal_job(` with `spawn_modal_job(` in the function body.

- [ ] **Step 3: Update `server/api/admin.py`**

Same pattern — remove local definition, import shared, replace calls.

- [ ] **Step 4: Run tests**

Run: `cd server && uv run pytest tests/api -q`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add server/services/spawn_modal_job.py server/api/start.py server/api/admin.py
git commit -m "refactor: extract spawn_modal_job into shared module"
```

---

### Task 2: Extract `_bootstrap_infra_imports()` into `infra/common.py`

The same function is copy-pasted in `infra/main.py`, `infra/modal_api.py`, and `infra/modal_jobs.py`.

**Files:**
- Modify: `infra/common.py` — add function (at top, before it's needed)
- Modify: `infra/main.py` — remove local copy, import from common
- Modify: `infra/modal_api.py` — remove local copy, import from common
- Modify: `infra/modal_jobs.py` — remove local copy, import from common

- [ ] **Step 1: Add to `infra/common.py`**

Add near the top, after imports but before `ENV`:

```python
def bootstrap_infra_imports() -> None:
    """Ensure the repo root is on sys.path for both local and Modal containers."""
    import sys
    local_repo_root = Path(__file__).resolve().parent.parent
    remote_repo_root = Path("/root/readme")
    for root in (local_repo_root, remote_repo_root):
        if (root / "infra").exists() and str(root) not in sys.path:
            sys.path.insert(0, str(root))
```

- [ ] **Step 2: Update `infra/main.py`**

`main.py` is special — it's the Modal entrypoint that must bootstrap before importing from `infra.common`. Keep a minimal 2-line bootstrap there, then call the shared function:

```python
import sys
from pathlib import Path

# Minimal bootstrap so we can import from infra
_repo = Path(__file__).resolve().parent.parent
if str(_repo) not in sys.path:
    sys.path.insert(0, str(_repo))

from infra.common import app, bootstrap_infra_imports

bootstrap_infra_imports()

import infra.modal_api  # noqa: F401
import infra.modal_jobs  # noqa: F401

__all__ = ["app"]
```

- [ ] **Step 3: Update `infra/modal_api.py` and `infra/modal_jobs.py`**

These are imported by `main.py` so `sys.path` is already set. Replace the entire `_bootstrap_infra_imports()` block with:

```python
from infra.common import bootstrap_infra_imports
bootstrap_infra_imports()
```

- [ ] **Step 4: Commit**

```bash
git add infra/common.py infra/main.py infra/modal_api.py infra/modal_jobs.py
git commit -m "refactor: extract _bootstrap_infra_imports into infra/common.py"
```

---

### Task 3: Remove dead dramatiq filter in `_server_dependencies()`

The filter `if not dep.startswith("dramatiq")` does nothing — dramatiq was already removed from `server/pyproject.toml`.

**Files:**
- Modify: `infra/common.py:40`

- [ ] **Step 1: Simplify**

```python
def _server_dependencies() -> list[str]:
    pyproject = tomllib.loads((ROOT_DIR / "server" / "pyproject.toml").read_text())
    return pyproject["project"]["dependencies"]
```

- [ ] **Step 2: Commit**

```bash
git add infra/common.py
git commit -m "chore: remove dead dramatiq filter from _server_dependencies"
```

---

## Chunk 2: Fix Modal production path per spec

### Task 4: Separate images per concern (bot, API, worker)

The spec requires separate container images to keep cold starts fast. Currently all three use a single `base_image` with all dependencies. The API only needs FastAPI+aiohttp+supabase, the worker needs PyMuPDF+google-genai+supabase, and the bot needs all of pipecat.

**Files:**
- Modify: `infra/common.py` — replace single `base_image` with three separate images

- [ ] **Step 1: Define dependency lists per image**

Replace the single `base_image` block in `infra/common.py` with:

```python
def _server_dependencies() -> list[str]:
    pyproject = tomllib.loads((ROOT_DIR / "server" / "pyproject.toml").read_text())
    return pyproject["project"]["dependencies"]


def _filter_deps(patterns: list[str]) -> list[str]:
    """Return server dependencies matching any of the given prefixes."""
    all_deps = _server_dependencies()
    return [d for d in all_deps if any(d.lower().startswith(p) for p in patterns)]


_COMMON_DEPS = ["loguru", "pydantic", "python-dotenv", "supabase", "pydantic-settings"]

_API_DEPS = _COMMON_DEPS + ["fastapi", "uvicorn", "aiohttp", "tenacity"]
_BOT_DEPS = _COMMON_DEPS + ["pipecat", "aiortc"]
_WORKER_DEPS = _COMMON_DEPS + ["pymupdf", "google-genai", "tenacity"]


def _make_image(dep_prefixes: list[str]) -> modal.Image:
    return (
        modal.Image.debian_slim(python_version="3.13")
        .pip_install(*_filter_deps(dep_prefixes))
        .add_local_dir(
            str(ROOT_DIR / "server"),
            remote_path=f"{REMOTE_ROOT}/server",
            ignore=LOCAL_DIR_IGNORE,
        )
    )


api_image = _make_image(_API_DEPS)
bot_image = _make_image(_BOT_DEPS)
worker_image = _make_image(_WORKER_DEPS)
```

Note: `infra/` directory is no longer mounted — it was unnecessary (only `server/` code runs in containers).

- [ ] **Step 2: Verify images build by running a dry deploy**

Run: `cd /Users/isabelleredactive/src/readme && ENV=dev uv run --project infra modal deploy --dry-run infra/main.py`

If `--dry-run` isn't available, just verify there are no Python syntax errors:
Run: `uv run --project infra python -c "from infra.common import api_image, bot_image, worker_image; print('ok')"`

- [ ] **Step 3: Commit**

```bash
git add infra/common.py
git commit -m "feat: separate Modal images per concern (bot, API, worker)"
```

---

### Task 5: Convert bot to `@app.cls` with memory snapshots

The spec calls for `enable_memory_snapshot=True` and `@modal.enter(snap=True)` to pre-load Silero VAD and Pipecat modules. The current implementation uses a top-level function which can't use snapshots.

**Files:**
- Modify: `infra/modal_jobs.py` — replace `run_bot_session` function with `BotSession` class

- [ ] **Step 1: Replace the bot function with a class**

Replace the `run_bot_session` function in `infra/modal_jobs.py` with:

```python
@app.cls(
    image=bot_image,
    secrets=secrets,
    region=[config.region],
    timeout=30 * 60,
    scaledown_window=300,
    enable_memory_snapshot=True,
)
@modal.concurrent(max_inputs=1)
class BotSession:
    """One instance per voice call."""

    @modal.enter(snap=True)
    def preload(self):
        """Pre-load heavy modules — this state gets snapshotted."""
        bootstrap_repo()
        import pipecat.audio.vad.silero  # noqa: F401
        import pipecat.pipeline.pipeline  # noqa: F401
        import pipecat.services.deepgram.stt  # noqa: F401
        import pipecat.services.cartesia.tts  # noqa: F401
        import pipecat.services.openai.llm  # noqa: F401

    @modal.method()
    async def run(self, room_url: str, token: str) -> None:
        from pipecat.runner.types import DailyRunnerArguments
        from server.bot.bot import bot

        await bot(DailyRunnerArguments(room_url=room_url, token=token, handle_sigint=False))
```

- [ ] **Step 2: Update spawn calls to use class method**

The `spawn_modal_job` utility uses `modal.Function.from_name()` which works for top-level functions. For class methods, the pattern is different:

```python
# modal.Cls.from_name(app_name, "BotSession")().run.spawn(room_url=..., token=...)
```

Update `server/services/spawn_modal_job.py` to handle both function and class method spawns. Or — simpler — keep `run_bot_session` as a thin top-level function that delegates to the class:

```python
# Keep this in modal_jobs.py as a top-level function for spawn compatibility
@app.function(image=bot_image, secrets=secrets, region=[config.region], timeout=30 * 60)
async def run_bot_session(room_url: str, token: str) -> None:
    """Thin wrapper so spawn_modal_job can call by function name."""
    await BotSession().run.remote(room_url=room_url, token=token)
```

Wait — this adds an extra hop. Better approach: update `spawn_modal_job.py` to support class methods, or just spawn directly in `start.py`. The simplest correct approach for now:

Keep `run_bot_session` as the spawnable function, but have it delegate to the class internally so the snapshot benefit still applies:

```python
@app.function(
    image=bot_image,
    secrets=secrets,
    region=[config.region],
    timeout=30 * 60,
)
async def run_bot_session(room_url: str, token: str) -> None:
    """Spawnable entry point — delegates to BotSession for snapshot benefits."""
    session = BotSession()
    await session.run.remote(room_url=room_url, token=token)
```

Note: This preserves the `modal.Function.from_name()` pattern used by `spawn_modal_job`. The `BotSession` class gets the memory snapshot and `max_inputs=1` benefits.

- [ ] **Step 3: Commit**

```bash
git add infra/modal_jobs.py
git commit -m "feat: convert bot to @app.cls with memory snapshots and max_inputs=1"
```

---

### Task 6: Clean up docker-compose unused env vars

`BOT_START_URL` and `BOT_START_PUBLIC_API_KEY` in the client service are unused since the Next.js proxy was deleted.

**Files:**
- Modify: `docker-compose.yaml:24-25`

- [ ] **Step 1: Remove the two lines**

```yaml
# Delete these from the client environment block:
      BOT_START_URL: http://bot:7860/start
      BOT_START_PUBLIC_API_KEY: ${BOT_START_PUBLIC_API_KEY:-}
```

- [ ] **Step 2: Verify config is valid**

Run: `docker compose config --quiet`
Expected: no output (valid)

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yaml
git commit -m "chore: remove unused BOT_START_URL and BOT_START_PUBLIC_API_KEY from client env"
```

---

## Chunk 3: Commit completed work + document deviations

### Task 7: Commit the already-tested work from today's session

These changes are already in the working tree and tested (39 tests pass). Commit in logical groups.

**Files:** All modified/new files from today's config refactor, CORS, and /start endpoint work.

- [ ] **Step 1: Commit client changes**

```bash
git add client/components/VoiceSession.tsx client/app/api/start/route.ts
git commit -m "feat: remove Next.js /api/start proxy, call API server directly"
```

- [ ] **Step 2: Commit config refactor**

```bash
git add server/shared/config.py server/settings.toml server/pyproject.toml server/uv.lock \
  server/services/pdf_pipeline/_gemini.py server/services/pdf_pipeline/storage.py
git commit -m "refactor: migrate config to pydantic-settings with LazySecretsSettings + TOML"
```

- [ ] **Step 3: Commit CORS + /start endpoint**

```bash
git add server/api/main.py server/api/start.py server/services/daily.py \
  server/api/admin.py server/tests/api/test_start.py server/tests/api/test_admin.py
git commit -m "feat: add CORS middleware and /start endpoint with local/Modal dual path"
```

- [ ] **Step 4: Commit docker-compose toml watch**

```bash
git add docker-compose.yaml
git commit -m "chore: watch .toml files in uvicorn dev reload"
```

---

### Task 8: Document known deviations from spec

Issues that need design decisions before implementation. Track for pre-prod.

**Files:**
- Create: `docs/superpowers/specs/2026-03-17-modal-infra-known-deviations.md`

- [ ] **Step 1: Create deviations document**

```markdown
# Modal Infrastructure — Known Deviations from Spec

Tracked issues from code review on 2026-03-17.
Address before first production deploy.

## Must fix before prod deploy

### 1. No internal API key authentication
The spec requires `INTERNAL_API_KEY` bearer token validation on all Modal API
routes except `/health`. Not implemented — the Modal API URL is currently public.
**Spec section:** "Initial hardening (MVP)"

### 2. No client-side proxy for production
The spec says "Browser never calls the Modal API directly in production."
The Next.js `/api/start` proxy was removed. For production, either restore a
production-only proxy route or protect the Modal URL with the internal API key.
**Spec section:** "Initial hardening (MVP)"

### 3. GitHub Actions only deploys dev
Pushes to main deploy `dev`. Prod deployment via GitHub releases is not yet
configured. Low priority until first prod deploy.

## Deferred optimizations

### 4. `python-dotenv` may be stale in server deps
With pydantic-settings, `load_dotenv()` is no longer called in `config.py`.
Check if bot or other code still needs it before removing.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-03-17-modal-infra-known-deviations.md
git commit -m "docs: document known deviations from Modal infra spec"
```

---

## Summary

| Chunk | Tasks | What |
|-------|-------|------|
| 1 | 1-3 | Code quality: extract duplicated code, remove dead filter |
| 2 | 4-6 | Production correctness: separate images, memory snapshots, max_inputs=1, cleanup |
| 3 | 7-8 | Commit tested work, document remaining deviations |

**Not in scope** (needs design decisions, tracked in deviations doc):
- Internal API key authentication
- Production client proxy strategy
- GitHub Actions prod deployment via releases
