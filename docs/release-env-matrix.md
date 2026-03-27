# Release Environment Variable Matrix

Last updated: 2026-03-22

This file is for hosted deploys (`dev` and `prod`). Local `.env` files remain the source for local Docker/dev runs.

## Architecture Overview

All backend services (API, bot, worker) run on **Modal**. The client (Next.js) runs on **Vercel**.

**Request flow (Modal path):**

1. Client calls `POST {NEXT_PUBLIC_API_BASE_URL}/start`
2. API (on Modal) creates a Daily room via Daily API
3. API spawns `run_bot_session` on Modal via `modal.Function.from_name(MODAL_APP_NAME, "run_bot_session")`
4. API returns `room_url` + `token` to the client
5. Client connects to Daily room; bot joins the same room

The client never talks to the bot directly — the API orchestrates everything.

## Modal Infrastructure

### How Modal apps are named

The `ENV` environment variable (set during CI deploy) determines the Modal app name:

- `ENV=dev` → app name `readme-dev`
- `ENV=prod` → app name `readme-prod`

This is defined in `infra/common.py`:

```python
config = ModalConfig(env=ENV)           # ENV from environment
app = modal.App(config.app_name)        # "readme-{env}"
```

### How `MODAL_APP_NAME` gets injected

`MODAL_APP_NAME` is **not set manually**. It is auto-injected as a Modal runtime secret during deployment:

```python
# infra/common.py
runtime_secret = modal.Secret.from_dict({"MODAL_APP_NAME": config.app_name})
secrets = [modal.Secret.from_name(config.secret_name), runtime_secret]
```

When the API runs on Modal, `MODAL_APP_NAME` is available as an env var (e.g. `readme-dev`). The API reads it via `settings.toml`:

```toml
[modal]
app_name = "${MODAL_APP_NAME}"
```

When `app_name` is non-empty, the API takes the Modal bot-spawn path. When empty (local dev), it falls back to calling `bot.start_url` directly (see Pipecat Cloud / local fallback below).

### Modal endpoint URLs

Pattern: `https://{workspace}--{app_name}-{function_name}.modal.run`

| Service  | Function     | Dev URL                                                        | Prod URL                                                        |
|----------|-------------|----------------------------------------------------------------|-----------------------------------------------------------------|
| API      | `serve_api` | `https://isischameleon--readme-dev-serve-api.modal.run`        | `https://isischameleon--readme-prod-serve-api.modal.run`        |
| Bot      | (spawned)   | Spawned internally by API — no public URL                      | Spawned internally by API — no public URL                       |
| Worker   | (spawned)   | Spawned internally by API — no public URL                      | Spawned internally by API — no public URL                       |

### Modal secret group

Each environment has a Modal secret group named `readme-{env}` (e.g. `readme-dev`) configured in the Modal dashboard. These must contain all the env vars listed below.

### CI deployment

Deployed via `.github/workflows/deploy-modal.yml`:

- **Push to `main`** → deploys `dev` automatically
- **Manual dispatch** → choose `dev` or `prod`
- Requires GitHub environment secrets: `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`

## API + Bot + Worker (Modal Secret Group)

These env vars must be set in the Modal secret group (`readme-dev` / `readme-prod`):

Required:

1. `SUPABASE_URL`
2. `SUPABASE_SECRET_KEY`
3. `SUPABASE_BOOKS_BUCKET`
4. `DAILY_API_KEY`
5. `OPENAI_API_KEY`
6. `DEEPGRAM_API_KEY`
7. `CARTESIA_API_KEY`
8. `GOOGLE_API_KEY`

Environment-specific values:

| Var                     | `dev`         | `prod`         |
|-------------------------|---------------|----------------|
| `SUPABASE_BOOKS_BUCKET` | `readme_dev`  | `readme_prod`  |

Note: `MODAL_APP_NAME` is **auto-injected** — do not add it to the secret group manually.

## Client (Vercel)

Required:

1. `NEXT_PUBLIC_API_BASE_URL` — the Modal API endpoint
2. `NEXT_PUBLIC_SUPABASE_URL`
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Vercel environment mapping:

1. `Preview` maps to `dev`
2. `Production` maps to `prod`

Client `NEXT_PUBLIC_API_BASE_URL` values:

1. `dev` (`Preview`): `https://isischameleon--readme-dev-serve-api.modal.run`
2. `prod` (`Production`): `https://isischameleon--readme-prod-serve-api.modal.run`

Note: `BOT_START_URL` and `BOT_START_PUBLIC_API_KEY` are **not needed** on the client when using the Modal path — the API handles bot spawning internally.

## Bot via Pipecat Cloud (Fallback)

If `MODAL_APP_NAME` is empty (i.e. bot is not on Modal), the API falls back to calling a bot runner directly via `bot.start_url` from `settings.toml`.

In this mode, the API forwards `POST /start` to the Pipecat Cloud endpoint, which creates the Daily room and runs the bot.

Pipecat Cloud bot requires these env vars (configured in Pipecat Cloud dashboard):

1. `OPENAI_API_KEY`
2. `DEEPGRAM_API_KEY`
3. `HUME_API_KEY`
4. `DAILY_API_KEY`

`bot.start_url` values:

1. `dev`: `https://api.pipecat.daily.co/v1/public/readme-bot-dev/start`
2. `prod`: set to the prod Pipecat public `/start` endpoint

## Local Development

Local dev uses Docker Compose (`docker compose up -d`). The client `.env` should contain:

```
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
NEXT_PUBLIC_BOT_START_URL="http://localhost:7860/start"
```

The API runs without `MODAL_APP_NAME` set, so it takes the direct bot-runner fallback path.

Optional for testing with a pre-existing Daily room:

1. `DAILY_SAMPLE_ROOM_URL`
2. `DAILY_SAMPLE_ROOM_TOKEN`
