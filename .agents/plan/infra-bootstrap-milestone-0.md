# Infra Bootstrap Milestone 0 (Tiny Service Per Layer)

Last updated: 2026-02-21
Goal: stand up one minimal, working piece in each infrastructure layer with managed services and low setup effort.

## 1) What We Are Building Right Now

Target outcome for this milestone:
1. API layer:
- one admin endpoint uploads PDF to Supabase Storage and writes metadata row.

2. Voice layer:
- existing Pipecat bot remains deployed/runnable.

3. Processing layer:
- Dramatiq worker receives a job and logs `"processing your book"` (no real processing yet).

4. Client layer:
- current Next.js app deployed on Vercel and connected to bot start endpoint env.

## 2) Minimal Managed Stack

1. Frontend: Vercel
2. API + worker runtime: Railway (2 services)
3. Database + object storage: Supabase
4. Queue broker for Dramatiq: Upstash Redis (or managed Valkey-compatible Redis)
5. Voice bot runtime: Pipecat Cloud

## 3) Is There Anything Else?

Yes, two additional required pieces:
1. Queue broker:
- Dramatiq needs Redis/Valkey or RabbitMQ; this is mandatory.

2. Secrets/environment management:
- each service must receive keys (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, broker URL, bot URL keys).

Nice-to-have (can be deferred):
1. Basic health checks and logs dashboard.
2. Alerting (even simple email/pager for failures).
3. CI pipeline.

## 4) Coding Agent Task Plan

## Task A: Add minimal data model for uploaded books

Do:
1. Add a migration SQL file for `books` table with minimal fields:
- `id uuid pk`
- `title text`
- `storage_path text`
- `status text` (default `uploaded`)
- `created_at timestamptz`

Touch files:
1. `/Users/isabelleredactive/src/readme/server/api/migrations/0001_books.sql` (new)

Acceptance:
1. Table exists in Supabase.
2. Insert/select test works.

## Task B: Add admin upload endpoint in API

Do:
1. Implement `POST /admin/books/upload` in FastAPI.
2. Validate file type is PDF.
3. Upload bytes to Supabase Storage bucket (for example `books` bucket).
4. Insert row into `books` table with `status='uploaded'`.
5. Enqueue Dramatiq job with `book_id`.
6. Return JSON: `book_id`, `status`.

Touch files:
1. `/Users/isabelleredactive/src/readme/server/api/main.py`
2. `/Users/isabelleredactive/src/readme/server/api/storage.py` (new helper)
3. `/Users/isabelleredactive/src/readme/server/api/db.py` (new helper)
4. `/Users/isabelleredactive/src/readme/server/api/schemas.py` (optional)

Acceptance:
1. `curl` upload returns 200 with `book_id`.
2. PDF appears in Supabase Storage path.
3. `books` row is created.
4. Job is queued.

## Task C: Add Dramatiq worker skeleton

Do:
1. Add Dramatiq dependency and broker config.
2. Implement actor `process_book(book_id)`:
- log `"processing your book"` with `book_id`
- update `books.status='processing'` then `books.status='ready'` (optional for this milestone)
3. Add worker start command.

Touch files:
1. `/Users/isabelleredactive/src/readme/server/pyproject.toml`
2. `/Users/isabelleredactive/src/readme/server/worker/__init__.py` (new)
3. `/Users/isabelleredactive/src/readme/server/worker/broker.py` (new)
4. `/Users/isabelleredactive/src/readme/server/worker/tasks.py` (new)
5. `/Users/isabelleredactive/src/readme/server/README.md`

Acceptance:
1. Worker process starts.
2. Upload triggers actor execution.
3. Worker log contains `"processing your book"` and `book_id`.

## Task D: Keep Pipecat bot deployable as-is

Do:
1. Confirm bot run path still works:
- local: `uv run python -m pipecat.runner.run`
2. Confirm client `/api/start` can point to Pipecat endpoint via env.

Touch files:
1. `/Users/isabelleredactive/src/readme/server/bot/bot.py` (no functional changes required)
2. `/Users/isabelleredactive/src/readme/client/app/api/start/route.ts` (only if env handling improvements needed)

Acceptance:
1. Bot session can be started from client.
2. No regressions in existing voice path.

## Task E: Deploy current client to Vercel

Do:
1. Create Vercel project for `/client`.
2. Set env vars in Vercel:
- `BOT_START_URL`
- `BOT_START_PUBLIC_API_KEY` (only if needed by endpoint)
3. Deploy preview, then production when validated.

Touch files:
1. `/Users/isabelleredactive/src/readme/client/env.example` (keep accurate)
2. `/Users/isabelleredactive/src/readme/client/README.md` (add deploy notes)

Acceptance:
1. Public client URL loads.
2. Clicking connect calls `/api/start` successfully.

## Task F: Add deployment/process docs for solo ops

Do:
1. Add one runbook for local/dev/prod startup commands.
2. Document env var matrix by service.
3. Document smoke test checklist.

Touch files:
1. `/Users/isabelleredactive/src/readme/.agents/plan/infra-bootstrap-milestone-0.md` (this file; keep updated)
2. `/Users/isabelleredactive/src/readme/server/README.md`
3. `/Users/isabelleredactive/src/readme/client/README.md`

Acceptance:
1. Another engineer (or future-you) can deploy from scratch with docs only.

## 5) Managed Service Setup Steps (Operator Checklist)

1. Supabase:
- Create project.
- Create `books` storage bucket.
- Apply `books` migration.
- Save `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

2. Upstash Redis (or equivalent managed Redis/Valkey):
- Create instance.
- Save broker URL for Dramatiq.

3. Railway:
- Create API service from `/server`.
- Create worker service from `/server` with worker command.
- Set env vars for both services.

4. Pipecat Cloud:
- Ensure bot image/deploy config exists.
- Verify `/start` endpoint for client usage.

5. Vercel:
- Import `/client`.
- Set `BOT_START_URL` and optional public key.
- Deploy preview then production.

## 6) Suggested PR Breakdown

1. PR 1:
- migration + API upload endpoint + storage write + books row.

2. PR 2:
- Dramatiq broker + actor skeleton + API enqueue.

3. PR 3:
- docs and deployment instructions + env matrix + smoke tests.

4. PR 4 (optional):
- small hardening (retry policy, upload size limits, structured logging).

## 7) Definition of Done for Milestone 0

1. You can upload a PDF via API.
2. PDF is present in Supabase Storage.
3. Worker receives job and logs `"processing your book"`.
4. Client is live on Vercel and can still start bot sessions.
5. All env vars and deploy steps are documented.

## 8) Time and Effort (Solo Founder Estimate)

1. Service account setup (Supabase + Upstash + Railway + Vercel + Pipecat Cloud): 2 to 4 hours.
2. Coding tasks (PR 1 + PR 2): 4 to 8 hours.
3. Deploy + smoke tests + docs: 2 to 4 hours.

Total: about 1 to 2 focused days.

## 9) Infrastructure as Code (IaC) Strategy for Multi-Service Releases

Goal:
- every deployable component is declared, versioned, and promoted by git tags/PRs instead of manual dashboard drift.

Recommended approach:
1. Use Terraform for managed infrastructure resources.
2. Keep application deploy configs in-repo next to code.
3. Use CI to apply infra changes and trigger app deploys in order.

### Repository layout (suggested)

1. `/Users/isabelleredactive/src/readme/infra/terraform/environments/dev`
2. `/Users/isabelleredactive/src/readme/infra/terraform/environments/prod`
3. `/Users/isabelleredactive/src/readme/infra/terraform/modules/*`
4. `/Users/isabelleredactive/src/readme/.github/workflows/infra-plan.yml`
5. `/Users/isabelleredactive/src/readme/.github/workflows/release.yml`

### What to manage with IaC

1. Supabase:
- project (if provider support meets needs) and SQL migrations in-repo
- storage bucket creation policy (if not provider-managed, use migration/bootstrap scripts)

2. Queue/broker:
- Upstash Redis database/credentials (or alternative provider resources)

3. Runtime platforms:
- Railway services and env vars (if provider coverage is insufficient, keep declarative service config files plus bootstrap script)
- Vercel project/env aliases (Terraform provider can manage many parts)
- Pipecat Cloud deployment config file versioned in repo (`pcc-deploy.toml`) and release script

4. Secrets:
- reference secrets from a central secret manager
- do not hardcode secrets in Terraform state or repo

### What stays outside Terraform

1. Application code deploy artifacts:
- container image build/push
- Next.js build outputs

2. Runtime migrations:
- DB migration execution during release pipeline

### Release workflow (single command path)

1. Merge PR to `main`.
2. CI `infra-plan` runs on PR and comments planned infra diff.
3. On merge/tag:
- Apply IaC for target environment.
- Run DB migrations.
- Deploy API service.
- Deploy worker service.
- Deploy Pipecat bot release.
- Deploy Vercel client.
4. Run post-deploy smoke tests:
- health endpoint
- upload endpoint
- queue job execution
- bot connect flow from client
5. Mark release successful only if smoke tests pass.

### Anti-drift rules

1. No manual production dashboard edits unless incident response.
2. If emergency manual change is made, back-port it into IaC within 24 hours.
3. Nightly drift check job: `terraform plan` against prod.

### Environment promotion model

1. `dev` applies automatically on merge.
2. `prod` applies on version tag or manual approval.
3. Reuse same modules and variable sets to avoid env-specific code forks.

### Minimal IaC adoption path (fast)

1. Phase 1:
- Terraform only for Redis + base platform resources + env vars.
- Keep existing platform deploy configs in repo.

2. Phase 2:
- expand Terraform coverage for Vercel/Railway/Supabase where stable.

3. Phase 3:
- policy checks, drift alerts, and release gates.

## 10) Decision Log (Chosen Approach)

Decision date: 2026-02-21

Chosen approach:
1. Platform-native config + CI release scripts now.
2. No Terraform/OpenTofu in Milestone 0.
3. Re-evaluate infra IaC tooling after first beta usage and first pain points.

Rationale:
1. Lowest setup burden for a solo founder.
2. Fastest path to first reliable beta releases.
3. Avoids tool overhead before infra complexity justifies it.

## 11) Immediate Execution Plan (Option 1)

### Step 1: Codify platform configs in repo

1. Keep and maintain:
- `/Users/isabelleredactive/src/readme/server/pcc-deploy.toml` (Pipecat bot deploy)
- `/Users/isabelleredactive/src/readme/client/env.example` (client runtime contract)
- `/Users/isabelleredactive/src/readme/server/env.example` (server/worker runtime contract)

2. Add:
- `/Users/isabelleredactive/src/readme/server/worker/` (Dramatiq worker code)
- `/Users/isabelleredactive/src/readme/server/api/migrations/` (DB migrations)
- `/Users/isabelleredactive/src/readme/docs/release-env-matrix.md` (single env matrix for all services)

### Step 2: Add CI workflows

1. PR workflow:
- lint + build checks
- migration validation (syntax and ordering)

2. Release workflow (manual dispatch first):
- apply DB migrations
- deploy API service
- deploy worker service
- deploy Pipecat bot
- deploy Vercel client
- run smoke tests and fail if any check fails

Suggested workflow files:
1. `/Users/isabelleredactive/src/readme/.github/workflows/ci.yml`
2. `/Users/isabelleredactive/src/readme/.github/workflows/release.yml`

### Step 3: Add smoke tests

Minimum checks:
1. API `/health` returns `200`.
2. Admin PDF upload endpoint returns `book_id`.
3. Worker receives queued job and logs `"processing your book"`.
4. Client can call `/api/start` and receive bot start payload.

Suggested file:
1. `/Users/isabelleredactive/src/readme/scripts/smoke.sh`

### Step 4: Establish anti-drift operations

Rules:
1. Changes to service env vars must be mirrored in `env.example` and `release-env-matrix.md`.
2. Manual dashboard edits require a follow-up PR in 24 hours.
3. Every release must pass smoke checks before being marked complete.

## 12) Trigger to Introduce Terraform/OpenTofu Later

Adopt Terraform/OpenTofu when at least one is true:
1. You need repeatable multi-environment provisioning beyond simple scripts.
2. Manual env/service drift causes release incidents.
3. You start rotating/adding infrastructure frequently and want `plan` visibility.

## 13) Execution Status

Status as of 2026-02-21:
1. Step 1 implementation completed in codebase:
- Added migration: `/Users/isabelleredactive/src/readme/server/api/migrations/0001_books.sql`
- Added worker skeleton: `/Users/isabelleredactive/src/readme/server/worker/tasks.py`
- Added admin router: `/Users/isabelleredactive/src/readme/server/api/admin.py`
- Added upload endpoint + models: `/Users/isabelleredactive/src/readme/server/api/admin.py` (`POST /admin/books/upload`, `UploadBookRequest`, `UploadBookResponse`)
- Added Supabase bucket config: `/Users/isabelleredactive/src/readme/server/shared/config.py` and `/Users/isabelleredactive/src/readme/server/env.example`
- Upload storage path is now household scoped: `/{household_id}/books/{book_id}.pdf`

2. Verified:
- Python compile/import checks pass for API/shared/worker modules.
