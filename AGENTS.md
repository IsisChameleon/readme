# Agent Instructions

- You can always edit Markdown files (`*.md`) in this repository without asking for extra permission.
- Test file naming convention: use `test_<filename>.py` for Python tests.
- Test folder structure convention: mirror source paths under `tests/`.
- Example: `core/call/bla.py` -> `tests/core/call/test_bla.py`.

## Local Dev Stack (Docker Compose)

- Compose file: `docker-compose.yaml`
- Default services: `client`, `api`, `bot`
- Optional worker profile services: `worker`, `dragonfly`

### Start Commands

- Start default stack:
  - `docker compose up --build`
- Start stack with worker profile:
  - `docker compose --profile worker up --build`
- Start in background with worker profile:
  - `docker compose --profile worker up --build -d`

### Stop Commands

- Stop and remove containers:
  - `docker compose down`
- Stop and remove containers + volumes:
  - `docker compose down -v`

### Port Overrides (optional)

- Defaults: `CLIENT_PORT=3000`, `API_PORT=8000`, `BOT_PORT=7860`, `DRAGONFLY_PORT=6379`
- Example override:
  - `CLIENT_PORT=3100 API_PORT=8100 BOT_PORT=7960 DRAGONFLY_PORT=6380 docker compose --profile worker up --build`

## Preferred Patterns (From Collaboration)

- Choose simplicity first.
- Do not add bells and whistles unless specifically asked.
- Do not be overly defensive by default.
- Prefer readable code with meaningful docstrings and unit tests.
- Keep initial implementation simple. Do not add extra hardening or complexity unless requested.
- For PDF ingestion planning in this project, keep scope focused on:
  - where PDFs are stored,
  - how PDFs are preprocessed,
  - how processed text is fed to the Pipecat pipeline.
- Do not introduce embeddings/RAG unless explicitly requested.
- For upload API responses consumed by frontend, prefer one user-facing status field over multiple internal queue statuses.
- Current preferred upload status after successful upload: `processing`.
- Prefer `pytest` for backend tests.
- Name scripts/checklists with explicit, descriptive names (avoid vague names like `current-changes`).
- If asked to commit staged work, commit only staged files.
- For this repo's local Docker setup:
  - Keep `client`, `api`, and `bot` in the default stack.
  - Put `worker` + broker (`dragonfly`) behind the `worker` profile.
  - Keep ports configurable via env vars with sensible defaults.
  - Do not add `UID:GID` user mapping unless explicitly requested.
  - On macOS, do not add watcher polling flags by default (`WATCHFILES_FORCE_POLLING`, `WATCHPACK_POLLING`) unless file watching issues are observed.
- Prefer explicit code over defensive dynamic patterns when dependencies are expected to exist.
  - Example: avoid `getattr(..., "send", None)` for Dramatiq actors when Dramatiq is required.
- Prefer boolean return values for enqueue outcomes (`True`/`False`) over string status flags like `"queued"`/`"not_queued"`.
