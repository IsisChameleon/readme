# Release Environment Variable Matrix

Last updated: 2026-02-22

This file is for hosted deploys (`dev` and `prod`). Local `.env` files remain the source for local Docker/dev runs.

## API + Worker

Required:

1. `SUPABASE_URL`
2. `SUPABASE_SECRET_KEY`
3. `SUPABASE_BOOKS_BUCKET`
4. `DRAMATIQ_BROKER_URL`

Environment values:

1. `dev`: `SUPABASE_BOOKS_BUCKET=readme_dev`
2. `prod`: `SUPABASE_BOOKS_BUCKET=readme_prod`

## Shared Redis State (Available Now)

When call-state storage is added, prefer separate credentials from the broker credentials:

1. `APP_REDIS_URL` (API/bot server-side Redis URL for call state)
2. `UPSTASH_REDIS_REST_URL` (optional; for Next.js server routes)
3. `UPSTASH_REDIS_REST_TOKEN` (optional; server-side only)

Note:

1. `DRAMATIQ_BROKER_URL` is for queue transport.
2. Do not expose Redis write credentials in browser-visible env vars.

## Bot (Pipecat Cloud)

Required:

1. `OPENAI_API_KEY`
2. `DEEPGRAM_API_KEY`
3. `HUME_API_KEY`
4. `DAILY_API_KEY`

## Client (Vercel)

Required:

1. `BOT_START_URL`
2. `BOT_START_PUBLIC_API_KEY` (optional; set only when start endpoint requires it)
3. `NEXT_PUBLIC_API_BASE_URL`

## Local-Only (Optional for Local Testing)

1. `DAILY_SAMPLE_ROOM_URL`
2. `DAILY_SAMPLE_ROOM_TOKEN`
