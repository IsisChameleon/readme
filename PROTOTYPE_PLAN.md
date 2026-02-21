# Kid Reading App Prototype Plan (Revised)

## Features / AKA Business Requirements

1. The app starts from a single main screen with a large orb interaction.
2. When the orb is pressed, the voice agent starts and greets the child by name.
3. The agent asks whether to continue reading the current book.
4. The agent must understand natural language intent, not keyword matching.
5. If the child expresses a positive intent (for example: "yes", "I'd like that", "please continue"), reading resumes from the saved point.
6. If the child expresses a negative intent (for example: "no", "not now", "stop"), the session ends politely for this prototype.
7. While reading, the child can interrupt at any time by speaking.
8. On interruption, the agent stops reading and answers the question using the book (PDF) context.
9. After answering, the agent resumes reading from where it left off unless the child asks to stop.
10. The agent remembers the child name.
11. The agent remembers progress for any book that was started (book-by-book resume state).
12. Prototype scope uses one demo PDF only.
13. Prototype is auth-free.
14. Response enrichment is allowed as long as answers remain grounded in the book context.

## Tech Stack

### Frontend
- Next.js (App Router) + TypeScript.
- Pipecat Voice UI Kit for RTC client primitives.
- Voice UI Kit orb component for the main interaction UI.
- Deploy on Vercel (fastest path for prototype iteration).

### Voice Agent
- Python Pipecat bot.
- Deploy bot on Pipecat Cloud (not self-hosted).
- Daily transport via Pipecat Cloud session start endpoint.

### Backend API
- FastAPI service for:
  - profile/session metadata (name, active book, current position),
  - PDF registration/preprocessing status,
  - optional server-side orchestration endpoints.
- Keep this service minimal and prototype-focused.

### Storage + Database
- Supabase Storage:
  - store demo PDF,
  - optional future cache artifacts (for example pre-generated segment audio).
- Supabase Postgres:
  - user profile (name),
  - books,
  - per-book reading progress,
  - optional session logs.

### Supabase Instead of Firestore
Using Supabase is a good fit here.

What works well:
- Postgres schema is simple for this prototype.
- Realtime subscriptions are supported through Supabase Realtime (logical replication over websockets), similar in spirit to Firestore listeners.
- Storage + DB in one platform keeps setup lean.

Tradeoffs to accept:
- Realtime semantics are different from Firestore document listeners (table/row events vs document streams).
- You need to design explicit row-level structures up front (which is fine for this scope).

### Explicitly Out of Scope For Prototype
- Redis.
- Worker queue infrastructure.
- Firestore emulator patterns.
- Observability stack/dashboards/alerting.

## Dev Setup

### Monorepo Layout (Inside Existing `readme` Repo)
Use the existing repo as the monorepo root and keep structure simple:

```text
readme/
  client/     # Next.js app
  server/     # FastAPI API + Pipecat bot codebase
```

Recommended server internals:

```text
server/
  api/        # FastAPI endpoints + DB/storage access
  bot/        # Pipecat bot entrypoint + prompting + reading state logic
  shared/     # shared config/models/helpers
```

This avoids over-separating early while still keeping API and bot concerns clear.

### Local Development Flow
Keep it minimal:
- `client`: run Next.js dev server.
- `server`: run FastAPI API.
- `bot`: run Pipecat bot locally against Daily transport when needed.

Use a lightweight `docker-compose` only if you want one-command startup, but only for services you actually need for prototype (client + server). No Redis, no worker containers.

### Environment Files
- `client/.env.local`
  - `BOT_START_URL`
  - `BOT_START_PUBLIC_API_KEY` (only when using Pipecat Cloud public endpoint)
- `server/.env`
  - Supabase URL/key(s)
  - LLM/STT/TTS keys needed by bot
  - Daily/Pipecat-related keys as needed for local bot runs

## Detailed Pattern Extraction From `pipecat-demo-with-screensharing`

### How to Connect Frontend to Bot Sessions Through a Local API Route
Pattern:
- Build a local API route in the frontend (`/api/start`) that proxies start requests to:
  - local bot (`http://localhost:7860/start`) in dev, or
  - Pipecat Cloud public start endpoint in deployed mode.

Why this is useful:
- The UI always calls one stable local endpoint.
- Switching local/cloud mode is pure env config.

What to copy:
- Optional Authorization header behavior.
- `createDailyRoom: true` request body pass-through.

Reference pattern source:
- `client/app/api/start/route.ts` in `pipecat-demo-with-screensharing`.

### How to Bootstrap Voice UI Kit Client Lifecycle
Pattern:
- Wrap app in `PipecatAppBase`.
- Use `connectParams.endpoint = "/api/start"`.
- Use render props (`handleConnect`, `handleDisconnect`) to wire your own UI.

Why this is useful:
- Fastest stable path to get connect/disconnect/session management working.
- Lets you replace demo UI with orb-first UX without rewriting transport internals.

Reference pattern source:
- `client/app/page.tsx`.

### How to Keep UI Custom While Reusing Pipecat Controls
Pattern:
- Use Voice UI Kit hooks/components for media and state.
- Keep your own layout and visuals (orb as primary UI).

Useful pieces to reuse:
- connection state hooks,
- audio controls,
- conversation state streams.

Reference pattern source:
- `client/app/ClientApp.tsx`.

### How to Build a Pipecat Bot Pipeline That Supports Interruptions
Pattern:
- Pipeline order concept: input -> STT -> context -> LLM -> TTS -> output.
- Use `PipelineParams(allow_interruptions=True)` to let user speech interrupt TTS/flow.

How to adapt for this prototype:
- Remove screen-sharing processors from the demo.
- Inject PDF/book context instead.
- Keep the same interruption-friendly pipeline structure.

Reference pattern source:
- `server/src/bot.py`.

### How to Expose Bot Entrypoint Compatible With Pipecat Cloud
Pattern:
- Implement async `bot(runner_args)` entrypoint.
- Create transport with `create_transport(...)`.
- Call `pipecat.runner.run.main()` in `if __name__ == "__main__"`.

Why this is useful:
- Matches Pipecat Cloud expected execution model.

Reference pattern source:
- `server/src/bot.py`.

### How to Package Bot for Pipecat Cloud Deployment
Pattern:
- Use a Pipecat base image.
- Install deps via `uv` with lockfile.
- Copy bot source.
- Keep container focused on bot runtime only.

Reference pattern source:
- `server/Dockerfile`.

### How to Configure Pipecat Cloud Agent Deployment
Pattern:
- Keep deployment config in `pcc-deploy.toml`:
  - `agent_name`,
  - image tag,
  - `secret_set`,
  - profile/scaling.

Reference pattern source:
- `server/pcc-deploy.toml`.

### How to Run Local/Cloud Without Rewiring Frontend Code
Pattern:
- Drive target selection through `BOT_START_URL` and `BOT_START_PUBLIC_API_KEY`.
- Keep frontend logic unchanged between environments.

Reference pattern source:
- `client/env.example`.

## Suggested Implementation Plan

### Phase 1: Repo Cleanup and Base Wiring
1. Replace current `readme/client` Vite scaffold with Next.js app based on the demo integration pattern.
2. Keep `readme/server` as Python project; split into `api` and `bot` modules.
3. Add clean env templates for client and server.
4. Confirm end-to-end connect to a local bot session first.

### Phase 2: Data Model and Supabase Integration
1. Create minimal tables:
   - `users` (display_name),
   - `books`,
   - `reading_progress` (user_id, book_id, current_position),
   - optional `sessions`.
2. Store one demo PDF in Supabase Storage.
3. Implement basic API methods for:
   - get/set user name,
   - get/set current reading progress for the demo book.

### Phase 3: Bot Reading and Resume Behavior
1. Add startup logic:
   - greet with child name,
   - ask whether to continue current book.
2. Implement intent handling for positive/negative natural language responses (not keyword-only flow control).
3. On positive intent, resume from saved position.
4. On negative intent, end session politely.

### Phase 4: Interruption and Q&A Behavior
1. While reading, allow child speech interruption.
2. On interruption:
   - stop reading,
   - answer using PDF/book context,
   - resume reading unless child asks to stop.
3. Ensure progression updates continue correctly after resume.

### Phase 5: Orb-First Frontend UX
1. Replace generic demo layout with a single-screen orb-first experience.
2. Keep only essential controls for prototype.
3. Show minimal session state (connecting, listening, speaking, ended).

### Phase 6: Deployment
1. Deploy bot to Pipecat Cloud using DockerHub image + Pipecat Cloud secrets.
2. Deploy frontend to Vercel.
3. Deploy API service to the quickest stable option you prefer (for example: a small container host).
4. Configure client env to use Pipecat Cloud `/start` endpoint and public key.

### Phase 7: Prototype Hardening (Only What Matters)
1. Test checklist:
   - start session from orb,
   - positive/negative natural language resume handling,
   - interruption handling,
   - progress persistence and resume correctness.
2. Fix only critical defects that block demo reliability.
