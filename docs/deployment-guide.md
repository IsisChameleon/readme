# Deployment Guide (Dev + Prod)

Last updated: 2026-02-22

## 1) Current Infra Baseline

This is the active deployment target for Milestone 0:

1. Client: Vercel (`client/`)
2. API: Railway (`server/api`)
3. Worker: Railway (`server/worker`)
4. Voice bot: Pipecat Cloud (`server/bot`, `server/pcc-deploy.toml`)
5. Database + file storage: Supabase (Postgres + Storage)
6. Queue broker + transient call state store: Upstash Redis (default)

For now, use Supabase Free while the product is still in development.

## 2) Where We Are Today

Implemented in code now:

1. `POST /admin/books/upload` exists and validates PDF uploads.
2. Upload writes PDF to Supabase Storage and inserts a `books` row.
3. Upload response status is user-facing and set to `processing`.
4. Dramatiq enqueue path exists and worker task logs `processing your book`.
5. API `GET /health` endpoint exists.
6. API tests pass locally (`9 passed` in `server/tests/api`).

Not implemented yet:

1. Full PDF extraction/normalization/chunking pipeline.
2. `GET /books/{book_id}/status` and chunk-read endpoints.
3. CI/release workflow files (`.github/workflows/ci.yml`, `.github/workflows/release.yml`).
4. End-to-end smoke script for deployed environments.

## 3) Environment Model

Use two isolated environments:

1. `dev`
2. `prod`

Rules:

1. Do not share Supabase projects between `dev` and `prod`.
2. Do not share Redis databases between `dev` and `prod`.
3. Keep separate Pipecat Cloud secret sets for `dev` and `prod`.
4. Keep separate Railway services for `dev` and `prod`.
5. Keep Vercel preview deployments for `dev` and production deployment for `prod`.
6. Keep separate Supabase buckets per environment (`readme_dev`, `readme_prod`).

Suggested names:

1. Railway: `readme-api-dev`, `readme-worker-dev`, `readme-api-prod`, `readme-worker-prod`
2. Supabase: `readme-dev`, `readme-prod`
3. Broker: `readme-dev-broker`, `readme-prod-broker`
4. Pipecat secret sets: `readme-dev`, `readme-prod`

## 4) One-Time Setup Checklist

Run this once for each environment (`dev` first, then `prod`).

### Supabase

1. Create project.
2. Create storage bucket (`readme_dev` in dev, `readme_prod` in prod).
3. Apply SQL migration from `server/api/migrations/0001_books.sql`.

### Queue Broker (Upstash Redis)

1. Create one Upstash Redis database per environment (`dev`, `prod`) in the closest region.
2. Use the Redis connection URL for worker/API broker traffic in `DRAMATIQ_BROKER_URL`.
3. Keep REST credentials separate for application/API use cases if needed.

### Railway

1. Create API service with root directory `server`.
2. Create worker service with root directory `server`.
3. API start command: `uv run uvicorn api.main:app --host 0.0.0.0 --port $PORT`
4. Worker start command: `uv run python -m dramatiq worker.tasks`
5. Set service env vars from `docs/release-env-matrix.md`.

### Pipecat Cloud

1. Build/push bot image from `server/`.
2. Keep `server/pcc-deploy.toml` as source of deploy config.
3. Create separate secret sets for `dev` and `prod`.
4. Include bot provider secrets (`OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `HUME_API_KEY`, `DAILY_API_KEY`).
5. Deploy bot and keep each environment's `/start` URL.

### Vercel

1. Import `client/`.
2. Configure preview env (`dev`) and production env (`prod`).
3. Set `BOT_START_URL` to the correct Pipecat `/start` endpoint per environment.
4. Set `NEXT_PUBLIC_API_BASE_URL` to matching API URL.

## 5) Deployment Runbook

### Dev

1. Apply latest DB migration in Supabase dev.
2. Deploy Railway API (`readme-api-dev`).
3. Deploy Railway worker (`readme-worker-dev`).
4. Deploy Pipecat bot using dev secret set.
5. Update Vercel preview env vars (if endpoints changed).
6. Trigger Vercel preview deploy.
7. Run smoke tests.

### Prod

1. Confirm `dev` smoke tests passed for the same commit.
2. Apply latest DB migration in Supabase prod.
3. Deploy Railway API (`readme-api-prod`).
4. Deploy Railway worker (`readme-worker-prod`).
5. Deploy Pipecat bot using prod secret set.
6. Update Vercel production env vars (if endpoints changed).
7. Trigger Vercel production deploy.
8. Run smoke tests.

## 6) Smoke Tests (Both Environments)

1. API health
```bash
curl -fsS "$API_BASE_URL/health"
```

2. Upload endpoint
```bash
curl -X POST "$API_BASE_URL/admin/books/upload" \
  -F "household_id=11111111-1111-1111-1111-111111111111" \
  -F "file=@/absolute/path/to/book.pdf;type=application/pdf"
```

Expected:

1. HTTP 200
2. Response includes `book_id`, `status="processing"`, and `storage_path`
3. Worker logs include `processing your book | book_id=...`

3. Frontend to bot connection

1. Open deployed client URL.
2. Trigger connect/start flow.
3. Confirm `/api/start` returns success and session starts.

## 7) Local Dev Stack Commands

Use these when running locally with Docker Compose:

1. Default stack (`client`, `api`, `bot`):
```bash
docker compose up --build
```
2. Add worker profile (`worker`, `redis`):
```bash
docker compose --profile worker up --build
```
3. Stop stack:
```bash
docker compose down
```

## 8) Next Documentation to Add

1. `docs/release-checklist.md` with a strict go/no-go checklist.
2. `scripts/smoke.sh` to automate the smoke tests above.
3. `.github/workflows/release.yml` for repeatable deploys.

## 9) Redis Usage Pattern (Broker + Shared Call State)

Using one Redis/Valkey backend for both Dramatiq and call state is valid. Keep strict key separation:

1. Dramatiq keys:
`dramatiq:*` (queue internals)
2. App call-state keys:
`call:*`, `session:*`, `presence:*`

Recommended key conventions:

1. `call:{session_id}:state` (hash, TTL 30-120 min)
2. `call:{session_id}:events` (stream/list for timeline events, TTL)
3. `user:{user_id}:active_call` (string, short TTL)

Important guardrails:

1. Do not expose full Redis credentials to the browser.
2. Browser should read/write via API routes (or read-only token with strict ACL when intentionally public).
3. Keep queue and app keys isolated by prefix and ACL policy.
