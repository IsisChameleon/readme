# Deployment Guide — Setting Up a New Environment

Last updated: 2026-04-04

## Architecture Overview

| Component | Platform | How deployed |
|-----------|----------|--------------|
| Client (Next.js) | Vercel | Auto-deploy on push |
| API + Worker | Modal | GitHub Actions (`deploy-modal.yml`) |
| Voice Bot | Pipecat Cloud | GitHub Actions (`deploy-pipecat-dev.yml`) |
| Database + Auth + Storage | Supabase | Migrations via GitHub Actions (`deploy-supabase-migrations.yml`) |

### Branch → Environment mapping

| Branch | Vercel env | Domain | Modal app |
|--------|-----------|--------|-----------|
| `main` | Preview | `dev.embertales.ai` | `readme-dev` |
| `production` | Production | `app.embertales.ai` | `readme-prod` |

## Step-by-step: Configure a new deployed environment

### 1. Supabase project

1. Create a new Supabase project (e.g. `readme-dev`)
2. Note these values (Settings → API):
   - **Project URL** → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SECRET_KEY`
   - **Database URL** (Settings → Database → Connection string → URI) → `SUPABASE_DB_URL`
3. Create a storage bucket named `readme_dev` (or `readme_prod`)
4. Configure **Authentication → URL Configuration**:
   - **Site URL**: `https://dev.embertales.ai` (or your domain)
   - **Redirect URLs**: add `https://dev.embertales.ai/auth/callback` and `https://dev.embertales.ai/auth/confirm`
5. Configure **Authentication → Providers → Google**:
   - Enable Google provider
   - Add your Google OAuth Client ID and Secret
   - The callback URL shown by Supabase (e.g. `https://xxx.supabase.co/auth/v1/callback`) must be added to Google Cloud Console (see next step)

> **Lesson learned**: If Google OAuth redirects to `localhost:3000` after sign-in, the Supabase Site URL is still set to localhost. This is the most common auth issue when deploying a new environment.

### 2. Google Cloud Console (OAuth)

1. Go to **APIs & Credentials → OAuth 2.0 Client IDs**
2. Edit your OAuth client
3. Add to **Authorized JavaScript origins**: `https://dev.embertales.ai`
4. Add to **Authorized redirect URIs**: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
5. Save

> **Lesson learned**: The Google OAuth `invalid_client` / `Error 401` error means the redirect URI from Supabase is not in the Google Cloud Console's authorized list.

### 3. Vercel (Client)

#### First-time project setup

1. Import the GitHub repo in Vercel
2. Set **Root Directory** to `client`
3. Set **Framework Preset** to **Next.js**

> **Lesson learned**: If Framework Preset gets set to "Other", the build completes in 0ms and produces nothing — every page returns a Vercel-level 404. Always verify it says "Next.js".

#### Environment / branch configuration

1. **Settings → Environments**: set the Production branch to `production` (not `main`)
2. **Settings → Environments → Preview**: assign `dev.embertales.ai` as a custom domain linked to the `main` branch
3. **Settings → Environments → Production**: `app.embertales.ai` is the production domain

#### Environment variables

Set these per environment (uncheck the environments you don't want for each value):

| Variable | Preview (dev) | Production |
|----------|--------------|------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://isischameleon--readme-dev-serve-api.modal.run` | `https://isischameleon--readme-prod-serve-api.modal.run` |
| `NEXT_PUBLIC_SUPABASE_URL` | dev Supabase Project URL | prod Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev Supabase anon key | prod Supabase anon key |

#### Deployment Protection

Vercel enables **Deployment Protection** for Preview deployments by default. This blocks all unauthenticated access with a 404 page (not 401 — it looks like a broken deployment, not an auth issue).

- To make `dev.embertales.ai` publicly accessible: **Settings → Deployment Protection** → disable for Preview
- To keep it private: leave enabled, but you'll need to be logged into Vercel to access

> **Lesson learned**: A Vercel 404 on a Preview deployment that shows a valid "Ready" status in the dashboard is almost always Deployment Protection blocking access. Check this before debugging the build.

### 4. Modal (API + Worker)

1. Create a Modal secret group named `readme-{env}` (e.g. `readme-dev`) in the Modal dashboard
2. Add these secrets to the group:

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SECRET_KEY` | Supabase service_role key |
| `SUPABASE_BOOKS_BUCKET` | `readme_dev` or `readme_prod` |
| `DAILY_API_KEY` | Daily.co API key |
| `OPENAI_API_KEY` | OpenAI key |
| `DEEPGRAM_API_KEY` | Deepgram STT key |
| `CARTESIA_API_KEY` | Cartesia TTS key |
| `GOOGLE_API_KEY` | Google Gemini key |
| `CORS_ALLOWED_ORIGINS` | `https://dev.embertales.ai` or `https://app.embertales.ai` |

`MODAL_APP_NAME` is auto-injected at deploy time — do not add it manually.

3. Add GitHub environment secrets (`MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`) for the CI workflow

### 5. Pipecat Cloud (Voice Bot)

1. Go to the Pipecat Cloud dashboard → your organization
2. Create a **public API key** named `readme-dev` (the CI workflow resolves the key by name)
3. Create a **secret set** named `readme-dev` with bot provider secrets (`OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, `DAILY_API_KEY`, etc.)
4. Add GitHub environment secrets (`PIPECAT_TOKEN`, `DOCKERHUB_TOKEN`) for the CI workflow

### 6. Supabase Migrations (CI)

1. Add `SUPABASE_DB_URL` as a GitHub environment secret (the database connection string)
2. Migrations run automatically on push to `main` when files in `supabase/migrations/` change
3. On GitHub release, migrations deploy to `prod`

> **Lesson learned**: If the migration casts a column type (e.g. `text` → `uuid`), existing data must be compatible. Run a one-time fix script against the DB before re-triggering the migration workflow. See `scripts/fix_test_household.sql` for an example.

### 7. GitHub environment secrets summary

Each GitHub environment (`dev`, `prod`) needs:

| Secret | Used by |
|--------|---------|
| `MODAL_TOKEN_ID` | Modal deploy workflow |
| `MODAL_TOKEN_SECRET` | Modal deploy workflow |
| `PIPECAT_TOKEN` | Pipecat bot deploy workflow |
| `DOCKERHUB_TOKEN` | Pipecat bot deploy workflow |
| `SUPABASE_DB_URL` | Supabase migration workflow |

## Smoke tests

After deploying all services:

1. **API health**: `curl -fsS https://isischameleon--readme-dev-serve-api.modal.run/health`
2. **Client loads**: visit `https://dev.embertales.ai` — should show login page
3. **Google OAuth**: sign in with Google — should redirect back to the app (not localhost)
4. **Voice session**: start a call from the dashboard — bot should connect

## Local dev stack commands

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

## Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Vercel 404 on Preview, deployment shows "Ready" | Deployment Protection enabled | Settings → Deployment Protection → disable for Preview |
| Vercel 404, build completed in 0ms | Framework Preset set to "Other" | Settings → Build and Deployment → change to "Next.js", redeploy |
| Google OAuth redirects to `localhost:3000` | Supabase Site URL still set to localhost | Supabase → Authentication → URL Configuration → update Site URL |
| Google OAuth `Error 401: invalid_client` | Redirect URI not in Google Cloud Console | Add Supabase callback URL to Google OAuth authorized redirect URIs |
| Supabase migration fails with UUID cast error | Pre-existing non-UUID data in DB | Run cleanup SQL before migration (see `scripts/` for examples) |
| Pipecat deploy fails "Could not resolve public API key" | API key name doesn't match or doesn't exist | Create the key in Pipecat Cloud dashboard with the exact name the workflow expects |
