# Modal Infrastructure Design

## Problem

The project has no production deployment yet. The current architecture assumes 6 separate
services (Vercel, Railway, Pipecat Cloud, Supabase, Upstash Redis, Docker Hub) configured
through click-ops dashboards. This is too many moving parts for a solo developer at MVP
stage, with no infrastructure-as-code, no colocation guarantees, and no upgrade path to
self-hosted models.

## Goals

1. Infrastructure defined as code, version-controlled alongside app code
2. Minimize number of services and dashboards
3. Colocate compute in the same region to minimize voice latency
4. Preserve upgrade path to self-hosted models (GPU functions) when scale justifies it
5. Keep existing app code largely unchanged — infra is a deployment layer
6. Keep Pipecat Cloud deployment path functional (not deleted, just not active)
7. Local dev workflow unchanged (docker compose, no Modal dependency)

## Reference implementation

The Modal [open-source-av-ragbot](https://github.com/modal-projects/open-source-av-ragbot)
demonstrates deploying a Pipecat voice bot on Modal. Key patterns adopted from it:

- `add_local_dir("server", remote_path="/root/server")` to mount app code into containers
- `with image.imports():` for lazy imports inside Modal containers
- `@modal.enter(snap=True)` for memory snapshots (faster cold starts)
- `max_inputs=1` on bot class (one voice call per container)
- `@modal.concurrent()` on API for higher throughput
- `modal.Dict.ephemeral()` for short-lived signaling state

The ragbot self-hosts models on GPUs — we skip that for MVP and use API services
(Deepgram, Cartesia, OpenAI) instead. The ragbot uses `SmallWebRTCTransport` — we use
`DailyTransport` for production-grade WebRTC.

## Solution

Deploy API, bot, and worker to Modal. Use Daily directly for WebRTC (not through Pipecat
Cloud). Keep Vercel for frontend and Supabase for database. Drop Railway, Upstash Redis,
Dramatiq, and Docker Hub from the production stack.

## Architecture

### Services (production)

| Component | Platform | Details |
|-----------|----------|---------|
| Voice Bot | Modal `@app.cls` | Uses `DailyTransport` — production WebRTC with TURN, Krisp |
| FastAPI | Modal `@modal.asgi_app` | Handles `/start`, book upload, health check, internal auth |
| PDF Worker | Modal `@app.cls` (`BookProcessor`) | `process_book`, `rechunk_book` — replaces Dramatiq |
| Frontend | Vercel | Next.js, auto-deploy from git |
| Database | Supabase | Postgres + Storage, unchanged |
| WebRTC | Daily.co | Direct API key, not through Pipecat Cloud |

**Region:** All Modal functions pinned to `us-west`. Daily rooms created in same region.

### Services (local dev)

| Component | How | Details |
|-----------|-----|---------|
| Voice Bot | Docker Compose + Pipecat runner | Daily transport, same as today |
| FastAPI | Docker Compose + uvicorn | Same as today |
| PDF Worker | FastAPI `BackgroundTasks` | No queue, no Redis — dispatch based on `ENV=local` |
| Frontend | Docker Compose + Next.js dev | Same as today |
| Database | Local Supabase | Same as today |

No Modal, Redis, or Dramatiq needed locally.

### Call flow (production reading session)

1. Frontend POSTs `/start` → Modal FastAPI
2. FastAPI creates Daily room via Daily REST API, gets `room_url`, `user_token`, and `bot_token`
3. FastAPI returns `{room_url, token: user_token}` to frontend immediately
4. FastAPI spawns bot via `BotSession.run.spawn(room_url, bot_token)` (fire-and-forget)
5. Frontend and bot connect to Daily room concurrently
6. RTVI `on_client_ready` triggers book selection flow

Implementation note: Modal docs clearly document `.spawn()` on top-level functions. For
class methods, confirm `.spawn()` support in the SDK version you install. If method spawn
is awkward, use a top-level Modal function as the fire-and-forget launcher.

**Failure mode:** If the bot spawn fails or crashes during cold start, the frontend joins
a Daily room with no bot. The frontend should implement a connection timeout (~10s) and
show an error/retry prompt. The Daily room will auto-expire (rooms have a configurable TTL).

### Call flow (production book upload)

1. Frontend POSTs `/admin/books/upload` → Modal FastAPI
2. FastAPI uploads PDF to Supabase Storage, creates `books` row
3. FastAPI spawns `process_book.spawn(book_id)` (fire-and-forget)
4. Worker runs `process_book_job(book_id)` — thin wrapper that preserves `status=error` on failure

**Retry safety:** `_process_book_impl` is idempotent — `upsert_chunks` deletes all existing
chunks before inserting, and `upload_manuscript` overwrites. Modal `retries=2` is safe.

### Call flow (local book upload)

1. Frontend POSTs `/admin/books/upload` → local FastAPI
2. FastAPI uploads PDF, creates `books` row
3. FastAPI dispatches via `BackgroundTasks.add_task(process_book_job, book_id)`

Note: `process_book_job` is synchronous. FastAPI runs `BackgroundTasks` sync functions
in a threadpool, so it won't block the request. Don't make it async without understanding
the threading implications.

## Repo structure

```
readme/
├── infra/                        # Modal infrastructure-as-code (separate deps)
│   ├── pyproject.toml            # Only dependency: modal
│   ├── uv.lock
│   ├── main.py                   # Single Modal entrypoint — imports API, bot, worker
│   ├── common.py                 # App definition, images, secrets, region config
│   ├── modal_api.py              # Mounts FastAPI as @modal.asgi_app
│   ├── modal_bot.py              # Bot as @app.cls with DailyTransport
│   └── modal_worker.py           # BookProcessor @app.cls — thin wrapper over worker/tasks.py
├── server/                       # Application code (small API/worker changes)
│   ├── api/                      # FastAPI app
│   ├── bot/                      # Pipecat bot (already supports DailyTransport)
│   ├── services/                 # pdf_pipeline, daily service
│   ├── shared/                   # config
│   ├── worker/                   # Keeps task wrappers, Dramatiq removed
│   ├── pcc-deploy.toml           # Pipecat Cloud config (kept, not active)
│   └── pyproject.toml            # App dependencies (no modal)
├── client/                       # Next.js frontend (small proxy changes)
└── docker-compose.yaml           # Local dev (worker/redis removed)
```

### Separation principle

`infra/` has its own `pyproject.toml` with `modal` as its only dependency. It does not
share a dependency tree with `server/`. This means:

- `infra/` can be moved to a separate repo without touching app code
- Local dev never needs `modal` installed
- App code in `server/` never imports from `infra/`
- `infra/` imports from `server/` only inside Modal containers via `with image.imports():`

### Module resolution in Modal containers

Following the ragbot pattern, container images mount app code with `add_local_dir`:

```python
bot_image = (
    modal.Image.debian_slim(python_version="3.13")
    .apt_install(...)
    .uv_pip_install(...)  # install deps from server/pyproject.toml
    .add_local_dir("../server", remote_path="/root/server")
)

with bot_image.imports():
    from server.bot.bot import bot
```

This avoids needing `server/` to be a pip-installable package. The `try/except ImportError`
pattern in existing code handles the difference between `from .library import Library`
(when run as a module) and `from library import Library` (when run directly). Inside Modal,
the `server.` prefix path will be used.

## Modal app structure

### `infra/common.py`

Environment-aware configuration as a `BaseModel`:

```python
from pydantic import BaseModel

class ModalConfig(BaseModel):
    """Modal deployment configuration. Single source of truth for app identity."""
    env: str  # dev | prod
    region: str = "us-west"

    @property
    def app_name(self) -> str:
        return f"readme-{self.env}"

    @property
    def secret_name(self) -> str:
        return f"readme-{self.env}"

ENV = os.environ.get("ENV", "dev")
config = ModalConfig(env=ENV)

app = modal.App(config.app_name)
secrets = [modal.Secret.from_name(config.secret_name)]
```

- `readme-dev` and `readme-prod` are separate apps with separate containers and URLs
- Deploy with: `ENV=dev modal deploy infra/main.py` / `ENV=prod modal deploy infra/main.py`
- CI workflow sets `ENV` per branch (main → prod, everything else → dev)

`infra/main.py` imports `modal_api`, `modal_bot`, and `modal_worker` so one deploy publishes
the FastAPI function plus the bot and worker classes into the same Modal app namespace.

**Separate images per concern** (following ragbot pattern):

| Image | Base | Dependencies | Mounts |
|-------|------|-------------|--------|
| `bot_image` | `debian_slim` + Python 3.13 | pipecat-ai[daily,deepgram,cartesia,silero], openai, supabase | `server/bot/`, `server/shared/` |
| `api_image` | `debian_slim` + Python 3.13 | fastapi, uvicorn, supabase, aiohttp (for Daily API) | `server/api/`, `server/shared/`, `server/services/` |
| `worker_image` | `debian_slim` + Python 3.13 | google-genai, PyMuPDF, supabase, tenacity | `server/services/`, `server/shared/` |

Separate images keep containers small and cold starts fast. Each image only includes
the dependencies it needs.

**Image must NOT include `.env` files.** All env vars come from `modal.Secret`.

### `infra/modal_api.py`

```python
@app.function(image=api_image, secrets=secrets, region=[config.region])
@modal.asgi_app()
@modal.concurrent(max_inputs=100)
def serve_api():
    from server.api.main import app as fastapi_app
    return fastapi_app
```

### `infra/modal_bot.py`

```python
@app.cls(
    image=bot_image,
    secrets=secrets,
    region=[config.region],
    timeout=30 * 60,           # 30 min max session
    scaledown_window=300,      # stay warm 5 min
    enable_memory_snapshot=True,
)
@modal.concurrent(max_inputs=1)
class BotSession:
    """One instance per voice call. Manages a single Pipecat session."""

    @modal.enter(snap=True)
    def setup(self):
        # Pre-load Pipecat, Silero VAD, etc. — snapshot this state
        pass

    @modal.method()
    async def run(self, room_url: str, token: str):
        from server.bot.bot import bot
        from pipecat.runner.types import DailyRunnerArguments
        args = DailyRunnerArguments(room_url=room_url, token=token)
        await bot(args)
```

### `infra/modal_worker.py`

```python
@app.cls(image=worker_image, secrets=secrets, region=[config.region])
class BookProcessor:
    """PDF processing worker. Thin Modal wrapper — no business logic here."""

    @modal.method(retries=2, timeout=600)
    def process_book(self, book_id: str):
        from server.worker.tasks import process_book_job
        process_book_job(book_id)

    @modal.method(retries=2, timeout=600)
    def rechunk_book(self, book_id: str):
        from server.worker.tasks import rechunk_book_job
        rechunk_book_job(book_id)
```

**No business logic in `infra/`.** The `_process_book_impl` and `_rechunk_book_impl`
functions live in `server/worker/tasks.py` — same file as today, just cleaned of
Dramatiq decorators and imports. Both `infra/modal_worker.py` (prod) and `admin.py`
via `BackgroundTasks` (local) call them.

## New code in server/

### `/start` endpoint — `server/api/start.py` (new file)

The current `/start` lives on the Pipecat runner (port 7860), not on FastAPI. A new
`/start` route is needed on the FastAPI side that:

1. Creates a Daily room via Daily REST API (`POST https://api.daily.co/v1/rooms`)
2. Creates two meeting tokens (`POST https://api.daily.co/v1/meeting-tokens`) — one for the user, one for the bot
3. Returns `{room_url, token}` to frontend, where `token` is the user token
4. Spawns the bot with the bot token (Modal `BotSession.run.spawn()` in prod, or no-op in local where
   Pipecat runner handles it)

Daily room creation logic belongs in `server/services/daily.py` (business logic, not infra).

**Error handling:** If the Daily API call fails, return 503 to the frontend. If the room
is created but bot spawn fails, the room auto-expires via Daily's TTL config. The frontend
handles bot-not-joining via a connection timeout.

**Response contract:** Must match what the RTVI client (`PipecatAppBase`) expects. The
frontend still receives `{room_url, token}` because the client only needs the user token.
The bot token remains server-side and is used only for bot startup.

### Worker dispatch — no dispatch class needed

In production, the FastAPI app runs inside Modal. It spawns the worker via
`modal.Cls.from_name()` — a runtime lookup that doesn't require importing from `infra/`:

```python
# In production (Modal) — runtime lookup, no infra/ import
import modal
processor = modal.Cls.from_name(f"readme-{ENV}", "BookProcessor")
processor().process_book.spawn(book_id)
```

Implementation note: Context7 documents `modal.Cls.from_name(...).method.remote(...)`
clearly, but not method `.spawn(...)` as clearly as top-level function `.spawn(...)`.
If needed, simplify the worker to top-level Modal functions for the first deploy.

In local dev, the API runs in Docker Compose with no Modal. It uses `BackgroundTasks`:

```python
# In local dev — same job wrapper, just called via BackgroundTasks
from server.worker.tasks import process_book_job
background_tasks.add_task(process_book_job, book_id)
```

A single `if ENV == "local"` in `admin.py` is sufficient. No dispatch class.
`server/` never imports from `infra/`.

Keep thin job wrappers in `server/worker/tasks.py`:

- `process_book_job(book_id)` catches exceptions, logs, sets `books.status="error"`, then raises
- `rechunk_book_job(book_id)` does the same for rechunk
- `_process_book_impl` and `_rechunk_book_impl` remain pure implementation helpers

Both local `BackgroundTasks` and Modal worker methods call the job wrappers, not the bare
`_impl` functions. That preserves current failure behavior.

### `server/services/daily.py` (new file)

Daily room and token management, adapted from the `DailyAPI` wrapper class in
`~/src/toocan-app/server/src/core/daily/daily.py`. Same pattern: static methods,
cached `aiohttp` session, Pydantic response models, structured error handling.

Simplified for readme (no recordings, no webhooks, no GCP secrets):

```python
class DailyRoomDetails(BaseModel):
    url: HttpUrl
    name: str
    bot_token: str
    user_token: str

class DailyAPI:
    """Daily.co API wrapper for room and token management."""

    @staticmethod
    @cache
    def _http() -> aiohttp.ClientSession:
        # Cached session with Bearer auth from DAILY_API_KEY
        ...

    @staticmethod
    async def create_room_and_tokens(
        user_name: str = "reader",
        bot_name: str = "readme-bot",
    ) -> DailyRoomDetails:
        # 1. POST /rooms — private room with exp + eject_at_room_exp
        # 2. POST /meeting-tokens — bot token
        # 3. POST /meeting-tokens — user token
        # Returns DailyRoomDetails with both tokens
        ...

    @staticmethod
    async def delete_room(room_name: str) -> None:
        # DELETE /rooms/:name — cleanup, 404 ignored
        ...

    @staticmethod
    async def shutdown() -> None:
        await DailyAPI._http().close()
```

Key design decisions from toocan reference:
- Separate bot and user tokens with distinct permissions
- Room expiry (`exp` + `eject_at_room_exp`) ensures cleanup even if bot crashes
- Token expiry (`eject_at_token_exp`) as additional safety net
- Private rooms only (require token to join)

### `server/shared/config.py` — add ENV

```python
ENV = os.environ.get("ENV", "local")  # local | dev | prod
```

## Changes to existing code

| File | Change | Scope |
|------|--------|-------|
| `server/bot/bot.py` | None | — |
| `server/api/main.py` | Include new `start` router | Tiny |
| `server/api/admin.py` | Replace `enqueue_process_book()` with `ENV` branch: `BackgroundTasks` locally, `BookProcessor().process_book.spawn()` in Modal | Small |
| `server/worker/tasks.py` | Remove Dramatiq, keep thin job wrappers + `_impl` helpers | Small |
| `server/pyproject.toml` | Remove `dramatiq` and `redis` dependencies | Small |
| `docker-compose.yaml` | Remove `worker` and `redis` services; add `ENV=local` to api service env | Small |
| `server/shared/call_state.py` | Delete | Deletion |
| `server/shared/config.py` | Add `ENV` variable | Tiny |
| `client/` | `/api/start` and `/api/admin/books/upload` proxy to Modal in prod | Small |
| `.github/workflows/` | New workflow for `modal deploy` | New file |

## Initial hardening (MVP)

This is not full end-user auth. It is the minimum hardening for a first deploy so the
public Modal URL is not directly callable without an internal secret.

1. Browser never calls the Modal API directly in production
2. Vercel route handlers proxy `/start` and `/admin/books/upload` to Modal
3. Vercel adds `Authorization: Bearer <INTERNAL_API_KEY>` from server env
4. Modal FastAPI validates that bearer token on all routes except `/health`
5. FastAPI CORS allows only the Vercel origin and localhost dev origins
6. Upload route keeps strict PDF validation and adds a server-side size limit

This is intentionally minimal. A follow-up ticket adds real user auth in the frontend
(email/password and Google sign-in) and ties API access to authenticated users.

## Shared state

- **Frontend ↔ Bot state:** RTVI events over Daily WebRTC. No shared store needed.
- **Persistent data:** Supabase (books, chunks, reading progress). Unchanged.
- **No Redis/shared call state in MVP:** delete `call_state.py` and reintroduce shared state only if a real requirement appears

## Cost (MVP scale)

| Service | Cost |
|---------|------|
| Modal compute (bot + API + worker) | ~$0.005-0.008/min active, $30/mo free credits |
| Daily WebRTC (audio, 2 participants) | ~$0.002/min, 10k free min/mo |
| Daily Krisp | ~$0.0004/min, included in Daily plan |
| Vercel | Free tier |
| Supabase | Free tier |
| **Total at MVP** | **~$0 (free tiers cover it)** |

## Cold start

- Modal containers boot in ~1s + Python init = **3-8s total** depending on image size
- `enable_memory_snapshot=True` on bot class — snapshots post-init state, reduces
  subsequent cold starts significantly (Silero VAD model, Pipecat init cached)
- `scaledown_window=300` — stay warm 5 min after last request
- `min_containers=1` (~$23/mo) if cold starts are unacceptable
- For a reading app where sessions last 10-30 min, `scaledown_window` is sufficient
- Separate images per concern keep each image small → faster cold starts

## Upgrade path

When scale justifies self-hosting models:
- Add `@app.function(gpu="A10G")` for STT/TTS/LLM in `infra/`
- Connect via Modal tunnels (same pattern as ragbot's `ModalTunnelManager`)
- Bot code swaps API service classes for local model service classes
- Everything stays colocated on Modal `us-west`
- No architectural changes needed

## What gets deleted

- `server/worker/Dockerfile`
- Dramatiq decorators and broker setup from `server/worker/tasks.py`
- `dramatiq` and `redis` dependencies from `server/pyproject.toml`
- `DRAMATIQ_BROKER_URL` from config and env files
- `APP_REDIS_URL` from config and env files
- Docker Compose `worker` and `redis` services (and `worker` profile)
- `enqueue_process_book` / `enqueue_rechunk_book` functions from any callers
- `server/shared/call_state.py`
- `server/tests/shared/test_call_state.py`

## What is NOT deleted

- `server/pcc-deploy.toml` — Pipecat Cloud config stays
- `server/.env.pipecat` — Pipecat Cloud secrets stay
- `.github/workflows/deploy-pipecat-dev.yml` — kept but disabled/renamed
- `server/worker/tasks.py` — stays, but without Dramatiq

## Post-implementation: update permanent documentation

After implementation, review and update all permanent architecture docs to reflect the
new Modal-based infrastructure. These are living documents (not point-in-time specs):

- `README.md` — project overview, setup instructions, deployment commands
- `docs/architecture.md` — tech stack, service topology, data flow
- `docs/deployment-guide.md` — deployment runbook (Modal replaces Railway/Pipecat Cloud)
- `docs/release-env-matrix.md` — env vars per service (drop Dramatiq/Redis, add Modal/internal API key)
- `docs/pipecat-cloud-deployment-guide.md` — mark as legacy/archived
- `CLAUDE.md` — if any infra-specific instructions exist

## Deferred

- Self-hosted models on Modal GPUs (do when API costs justify it)
- RAG component on Modal (natural fit as `@app.function` with a Modal Volume for embeddings)
- `modal serve` for local infra verification (nice to have, not blocking)
