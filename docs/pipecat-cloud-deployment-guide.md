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
# Example values
BOT_START_URL="https://api.pipecat.daily.co/v1/public/<agent-name>/start"
BOT_START_PUBLIC_API_KEY="pk_..."
```

## 2) Configure `pcc-deploy.toml`

File: `server/pcc-deploy.toml`

Set:

1. `agent_name`
2. `image` (Docker image tag you will push)
3. `secret_set`
4. `agent_profile`
5. `scaling.min_agents`

Example:

```toml
agent_name = "readme-reading-agent"
image = "your-dockerhub-user/readme-server:0.1.0"
secret_set = "readme-dev"
agent_profile = "agent-2x"
enable_krisp = true

[scaling]
min_agents = 0
```

## 3) Auth + Secrets

From `server/`:

```bash
uv run pcc auth login
uv run pcc secrets set readme-dev --file .env
```

Important from real deploy notes:

1. Avoid inline comments in `.env` values before importing with `pcc secrets set`.
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
  --env-file server/.env \
  your-dockerhub-user/readme-server:0.1.0 \
  python -m pipecat.runner.run
```

## 5) Deploy Agent

If image is public:

```bash
uv run pcc deploy readme-reading-agent --secrets readme-dev --no-credentials
```

If image is private:

1. Create/use image pull secret in Pipecat Cloud.
2. Deploy with `--credentials <pull-secret-name>`.

If deploy does not become ready quickly:

```bash
uv run pcc agent logs readme-reading-agent
```

## 6) Post-Deploy Verification

1. Start endpoint works:
```bash
curl -X POST "https://api.pipecat.daily.co/v1/public/<agent-name>/start" \
  -H "Authorization: Bearer <public-api-key>" \
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
