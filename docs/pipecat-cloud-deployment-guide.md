# Pipecat Cloud Deployment Guide

Last updated: 2026-02-22

This guide is based on actual deployment notes from this project and focuses on repeatable deploys with fewer surprises.

## 1) Local vs Cloud Client Routing

Client start route config lives in local frontend env:

```env
BOT_START_URL="http://localhost:7860/start"
BOT_START_PUBLIC_API_KEY=""
```

To point local frontend to Pipecat Cloud instead:

```env
BOT_START_URL="https://api.pipecat.daily.co/v1/public/readme-bot-dev/start"
BOT_START_PUBLIC_API_KEY="pk_d2d3d37a-a042-45eb-8abf-209e0c361641"
```

## 2) Configure `pcc-deploy.toml`

File: `server/pcc-deploy.toml`

Set:

1. `agent_name`
2. `image` (Docker image tag you will push)
3. `secret_set`
4. `agent_profile`
5. `scaling.min_agents`

Current dev config:

```toml
agent_name = "readme-bot-dev"
image = "isischameleon/readme-bot:latest"
secret_set = "readme-dev"
agent_profile = "agent-1x"
enable_krisp = true

[scaling]
min_agents = 0
```

## 3) Auth + Secrets

From `server/`:

```bash
uv run pcc auth login
uv run pcc secrets set readme-dev --file .env.pipecat
```

Important from real deploy notes:

1. Avoid inline comments in `.env.pipecat` values before importing with `pcc secrets set`.
2. Verify the secret set name exactly matches `secret_set` in `pcc-deploy.toml`.

## 4) Build and Push Agent Image

From `server/`:

```bash
uv run pcc docker build-push
```

Always test the image locally before cloud deploy:

```bash
docker run -it --rm \
  -p 7860:7860 \
  --env-file .env.pipecat \
  isischameleon/readme-bot:latest \
  python -m pipecat.runner.run
```

## 5) Deploy Agent

If image is public:

```bash
uv run pcc deploy readme-bot-dev --secrets readme-dev --no-credentials
```

If image is private:

1. Create/use image pull secret in Pipecat Cloud.
2. Deploy with `--credentials readme-dockerhub-pull-secret`.

If deploy does not become ready quickly:

```bash
uv run pcc agent logs readme-bot-dev
```

## 6) Post-Deploy Verification

1. Start endpoint works:
```bash
curl -X POST "https://api.pipecat.daily.co/v1/public/readme-bot-dev/start" \
  -H "Authorization: Bearer pk_d2d3d37a-a042-45eb-8abf-209e0c361641" \
  -H "Content-Type: application/json" \
  -d '{"createDailyRoom": true}'
```
2. Verify returned payload is usable by `client/app/api/start/route.ts`.
3. Confirm client can connect and start a session.

## 7) Common Failure Modes

1. Deployment hangs in non-ready state:
Check logs for import/runtime failures. Common root cause is incorrect Dockerfile copy path or missing source files.

2. Deploy command fails for pull credentials:
Public image: use `--no-credentials`. Private image: configure image pull secret and pass `--credentials`.

3. Start route fails from client:
Wrong `BOT_START_URL`, missing/wrong `BOT_START_PUBLIC_API_KEY`, or bot deployment not ready.

## 8) Environment Recommendations

1. Keep separate agents and secret sets for `dev` and `prod`.
2. Keep separate public API keys for `dev` and `prod`.
3. Do not reuse prod secret sets for local testing.

## 9) Automation (Dev Only, Main Branch)

Current automation file:

1. `.github/workflows/deploy-pipecat-dev.yml`

Behavior:

1. Triggers on `push` to `main` (and manual `workflow_dispatch`).
2. Builds and pushes a Docker image for the bot.
3. Runs a container import smoke test (`import bot`) on the pushed image tag.
4. Deploys Pipecat Cloud using `server/pcc-deploy.toml`.
5. Uses `readme-dev` secret set.
6. Checks agent status after deploy.

CI runtime note:

1. Workflow pins `uv` to Python 3.13 (`UV_PYTHON=3.13`) to avoid `onnxruntime` wheel mismatch on Python 3.14.

One-time setup:

1. In `server/`, keep a clean deploy secrets file named `.env.pipecat`.
2. Push that secret set to Pipecat Cloud once:
```bash
cd server
uv run pcc secrets set readme-dev --file .env.pipecat --skip
```
3. In GitHub repo settings, add Actions environment secrets under environment `dev`:
   - `PIPECAT_TOKEN`
   - `DOCKERHUB_TOKEN`

Notes:

1. `PIPECAT_TOKEN` is the CLI auth token (used by `pcc` in CI).
2. The workflow is pinned to organization `stormy-badger-olive-971`.
3. The workflow resolves the public API key named `readme-prototype` by running `pcc organizations keys list` and uses that key for post-deploy `/start` smoke testing.
4. Keep `prod` deployment manual until production rollout is ready.

## 10) Manual Interventions (Clear Checklist)

These steps are still manual even with `main`-merge automation.

### Before First Automated Deploy

1. Add GitHub Actions environment secrets in `dev`:
   - `PIPECAT_TOKEN`
   - `DOCKERHUB_TOKEN`
2. Sync Pipecat deploy secrets from local clean file:
```bash
cd server
uv run pcc secrets set readme-dev --file .env.pipecat --skip
```
3. Confirm public API key `readme-prototype` exists in org `stormy-badger-olive-971`:
```bash
cd server
uv run pcc organizations keys list --organization stormy-badger-olive-971
```

Token sources:

1. `PIPECAT_TOKEN`:
   - Run `uv run pcc auth login` from `server/`.
   - Copy `token` from `~/.config/pipecatcloud/pipecatcloud.toml` into GitHub secret `PIPECAT_TOKEN`.
2. `DOCKERHUB_TOKEN`:
   - In Docker Hub, create a Personal Access Token (Account Settings -> Personal Access Tokens).
   - Use that value for GitHub secret `DOCKERHUB_TOKEN`.
   - Workflow Docker Hub username is pinned to `isischameleon`.

### During Normal Dev Deploys

1. Merge to `main` to trigger deployment automatically.
2. If you need a deploy without a new `main` merge, run GitHub Actions `workflow_dispatch` manually.

### When Secrets or Credentials Change

1. Refresh Pipecat secret set whenever any bot runtime secret changes in `.env.pipecat`:
   - `OPENAI_API_KEY`
   - `DEEPGRAM_API_KEY`
   - `HUME_API_KEY`
   - `DAILY_API_KEY`
   - any other bot env used at runtime
2. Re-push secret set after those changes:
```bash
cd server
uv run pcc secrets set readme-dev --file .env.pipecat --skip
```
3. Verify secret set keys are present:
```bash
cd server
uv run pcc secrets list
```
4. If `PIPECAT_TOKEN` expires/revokes, refresh with `uv run pcc auth login` and update GitHub secret `PIPECAT_TOKEN`.
5. If Docker Hub token rotates, update GitHub secret `DOCKERHUB_TOKEN`.

### When Agent Identity Changes

1. If `agent_name` changes in `server/pcc-deploy.toml`, update client `BOT_START_URL` in Vercel to the matching endpoint format `https://api.pipecat.daily.co/v1/public/<new-agent-name>/start` (current value: `https://api.pipecat.daily.co/v1/public/readme-bot-dev/start`).
2. If API key naming convention changes from `readme-prototype`, update `PIPECAT_DEFAULT_PUBLIC_KEY_NAME` in `.github/workflows/deploy-pipecat-dev.yml`.

### Production

1. Production Pipecat deploy remains manual until a dedicated prod workflow is added.
