# PDF to Pipecat TTS Plan (Living Document)

Last updated: 2026-02-21
Scope: Store a PDF, preprocess it, and feed processed text to the Pipecat pipeline for read-aloud.
Out of scope: Embeddings, RAG, semantic retrieval.

## 1) Goal

Build a reliable flow:
1. Parent uploads PDF.
2. System preprocesses PDF into clean, ordered chunks.
3. Pipecat bot reads chunks in sequence via TTS.
4. Progress is persisted so reading can resume.

## 2) Architecture (Current + Target)

Current repo components:
- `client/`: Next.js app.
- `server/api/`: FastAPI API.
- `server/bot/`: Pipecat bot runtime.
- Supabase is already configured as the persistence platform in env/config.

Target architecture for this scope:
1. Storage layer:
- Keep original PDF in Supabase Storage bucket.
- Keep metadata and processing status in Postgres `books`.
- Keep preprocessed read units in Postgres `book_chunks`.

2. Processing layer:
- Asynchronous job runner processes PDF after upload.
- Recommended job runtime: Dramatiq worker (Redis/Valkey broker).

3. Runtime voice layer:
- Pipecat bot reads from `book_chunks` ordered by `chunk_index`.
- Bot never parses raw PDF in live voice loop.

## 3) Data Model (No embeddings)

### `books`
- `id` uuid pk
- `household_id` uuid (if household model is active)
- `title` text
- `storage_path` text
- `checksum_sha256` text
- `status` text check in (`uploaded`, `processing`, `ready`, `failed`)
- `source_page_count` int nullable
- `processing_error` text nullable
- `created_at` timestamptz
- `updated_at` timestamptz

### `book_chunks`
- `id` uuid pk
- `book_id` uuid fk books(id)
- `chunk_index` int
- `text` text
- `page_start` int nullable
- `page_end` int nullable
- `char_count` int
- `created_at` timestamptz

Constraints:
- unique (`book_id`, `chunk_index`)
- index on (`book_id`, `chunk_index`)

### `reading_progress`
- `kid_id` uuid
- `book_id` uuid
- `current_chunk_index` int
- `updated_at` timestamptz
- primary key (`kid_id`, `book_id`)

## 4) Storage Decision

Where to store PDF:
- Supabase Storage bucket, path pattern:
  - `/{household_id}/books/{book_id}.pdf` (or `/books/{book_id}.pdf` for auth-free prototype)

Do we need to keep original PDF?
- Recommended: yes, keep it.
- Why:
  - reprocessing after parser fixes
  - debugging extraction defects
  - compliance/audit trail if needed
- Optional policy:
  - delete original after successful processing + retention window.

## 5) Preprocessing Pipeline

Input: `book_id`, `storage_path`.
Output: ordered `book_chunks` rows and `books.status='ready'`.

Steps:
1. Download PDF bytes from Supabase Storage.
2. Extract text page by page.
3. Normalize text:
- remove repeated headers/footers/page numbers
- undo hyphenated line breaks
- collapse wrapped lines into paragraphs
- preserve major section boundaries when detected
4. Segment into TTS-safe chunks:
- sentence-aware chunking
- target chunk size (example): 300-700 chars
- hard max (example): 900 chars
- avoid cutting mid-sentence where possible
5. Validate minimum quality:
- non-empty text
- minimum number of chunks
- fail early if extraction is unusable
6. Transactional write:
- delete existing chunks for `book_id` (idempotent rerun)
- insert new ordered chunks
- update `books.status='ready'`, `source_page_count`
7. On error:
- set `books.status='failed'`
- write `processing_error` summary

## 6) Worker Runtime Options

### Option A (recommended): Dramatiq worker

Flow:
1. FastAPI upload endpoint stores PDF and creates `books` row.
2. API enqueues `process_pdf(book_id)` Dramatiq task.
3. Worker performs preprocessing and writes chunks.

Why this is preferred:
- team familiarity
- clean retry semantics
- simple separation between API latency and heavy processing

Broker choices:
- Redis
- Valkey (OSS Redis-compatible alternative)
- RabbitMQ (if preferred in org)

### Option B: Serverless function trigger
- Trigger on storage upload.
- Pros: managed ops.
- Cons: package size, runtime/memory/time limits for PDF libs.

### Option C: Cloud Run Job / batch container
- Triggered by API or scheduler.
- Good for heavier PDFs without function limits.

### Option D: In-request processing (not recommended)
- Only viable for tiny MVP.
- Blocks request and hurts UX/reliability.

## 7) API Contracts (Minimal)

### `POST /books/upload`
- multipart file upload
- behavior:
  - write PDF to storage
  - insert `books` row with `uploaded`
  - enqueue preprocessing job
- response:
  - `book_id`
  - `status` (`uploaded` or `processing`)

### `GET /books/{book_id}/status`
- returns:
  - `status`
  - `processing_error` (if failed)
  - `chunk_count` when ready

### `GET /books/{book_id}/chunks?from={i}&limit={n}`
- internal endpoint for bot runtime if direct DB access is not used.

## 8) Pipecat Integration Contract

Bot runtime responsibilities:
1. On session start, resolve active `book_id` and `current_chunk_index`.
2. Fetch next chunk text.
3. Send chunk text through LLM/TTS flow for spoken output.
4. After each spoken chunk, persist `current_chunk_index + 1`.
5. Continue until end-of-book or interruption/stop intent.

Implementation note for current code:
- Existing pipeline is in `server/bot/bot.py`.
- Add a reading controller layer that emits deterministic chunk text while in read mode.
- Keep STT and interruption handling active.

## 9) Idempotency, Reliability, and Failure Handling

Idempotency:
- `process_pdf(book_id)` can run multiple times safely.
- Always replace `book_chunks` for that `book_id` in one transaction.

Retries:
- Use Dramatiq retries with capped backoff.
- Mark permanently failed after max retries.

Concurrency controls:
- Prevent duplicate processing of same `book_id` (status lock or advisory lock).

Observability:
- Log with `book_id` correlation id.
- Track counts: upload success, processing success/fail, average processing time.

## 10) Security and Access

- API uses service role for storage/database.
- Client never receives service role key.
- Validate MIME and extension (`application/pdf`, `.pdf`) at upload.
- Set max file size threshold in API.

## 11) PR Plan

### PR 1: Schema + status API + upload plumbing
- Add DB migrations: `books`, `book_chunks`, `reading_progress`.
- Add `POST /books/upload`.
- Add `GET /books/{book_id}/status`.
- Save PDF in Supabase Storage and write `books` row.
- No preprocessing execution yet (can stub enqueue).

### PR 2: Dramatiq infrastructure
- Add Dramatiq setup, broker config, worker entrypoint.
- Add `process_pdf(book_id)` task scaffold.
- Wire API enqueue call after upload.

### PR 3: PDF extraction + normalization + chunking
- Implement processor logic.
- Write chunks to `book_chunks`.
- Status transitions + error handling.
- Unit tests for normalization and chunking.

### PR 4: Bot reads from chunk store
- Add read controller in bot runtime.
- Read sequential chunks and feed TTS path.
- Persist `reading_progress`.
- Add end-to-end smoke test for upload -> ready -> read.

### PR 5: Hardening
- Retry/backoff tuning.
- Duplicate job prevention.
- Structured logging and operational runbook.

## 12) Manual PDF Upload Options (Right Now)

1. Supabase Dashboard UI:
- Storage -> bucket -> Upload file.
- Fastest manual path for testing.

2. Supabase CLI:
- Scriptable local/dev workflow.
- Useful for repeatable test fixtures.

3. One-off Python script using Supabase client:
- Uses `SUPABASE_URL` + `SUPABASE_SECRET_KEY`.
- Good when you want to automate path naming from `book_id`.

4. Temporary admin FastAPI endpoint (dev-only):
- `POST /admin/books/upload-raw`.
- Good for team internal testing; remove before production.

## 13) Production Deployment (Solo Founder: cheap + fast)

Recommended managed stack:
1. Frontend:
- Vercel (`client/`)

2. Voice runtime:
- Pipecat Cloud (`server/bot/` container deploy)

3. Database + object storage:
- Supabase (Postgres + Storage bucket for PDFs)

4. API + PDF worker:
- Railway (two services from same repo image or two process commands)
  - FastAPI service
  - Dramatiq worker service

5. Broker for Dramatiq:
- Upstash Redis (managed, pay-as-you-go), or Valkey-compatible managed Redis

Why this is the recommended default:
- fastest setup with minimal infra code
- mostly dashboard-based ops
- easy to keep monthly fixed costs low early on

### Setup Effort (rough)

Option A (recommended): Vercel + Pipecat Cloud + Supabase + Railway + Upstash
- 6 to 12 hours for first production deployment
- Includes DNS/env setup, secrets, first smoke tests, and worker queue wiring

Option B: replace Railway with Cloud Run
- 12 to 20 hours
- Lower idle cost potential, higher setup complexity (IAM, service config, deploy flow)

Option C: Dragonfly Cloud as broker/store
- Add ~0.5 to 1.5 extra days for compatibility soak testing with Dramatiq Lua behavior

## 14) Cost Model (Infrastructure Only)

### Fixed/mostly-fixed components
- Vercel Pro: $20/month
- Supabase Pro: $25/month base subscription
- Supabase compute credits: $10/month included
- Supabase Micro compute: about $10/month per running project
  - one always-on Micro project often nets close to base plan total after credits in examples
- Railway: $5/month minimum + usage

### Variable components
- Pipecat Cloud hosting (`agent-1x`): $0.01/active session minute
- Pipecat reserved instances (`agent-1x`): $0.0005/minute when min agents > 0
- Daily WebRTC 1:1 voice transport on Pipecat Cloud: free
- Upstash Redis:
  - Free: 500K commands/month
  - PAYG: $0.20 per 100K commands

### Example monthly infrastructure scenarios

Assumptions:
- `min_agents=0` on Pipecat Cloud (no reserved cost)
- one Supabase project
- two lightweight Railway services (API + worker)

1. Lean MVP (2,000 session minutes/month)
- Pipecat hosting: ~$20
- Vercel: $20
- Supabase: ~$25+
- Railway + queue: ~$10 to $30
- Total infra: roughly **$75 to $110/month**

2. Early traction (10,000 session minutes/month)
- Pipecat hosting: ~$100
- Vercel: $20
- Supabase: ~$25+
- Railway + queue: ~$15 to $45
- Total infra: roughly **$160 to $220/month**

3. Growing usage (50,000 session minutes/month)
- Pipecat hosting: ~$500
- Vercel: $20
- Supabase: ~$25+ (can rise with usage and compute tier)
- Railway + queue: ~$30 to $120
- Total infra: roughly **$575 to $765+/month**

Important:
- LLM/STT/TTS provider usage is not included above and can become the dominant cost.

## 15) Dragonfly Cloud Fit (for this architecture)

What is attractive:
- fully managed
- memory-based pricing model
- simple calculator and pay-as-you-go posture

What to watch:
- Dramatiq can depend on Redis Lua script behavior.
- There is an open Dragonfly issue for Dramatiq worker compatibility (`dramatiq:__heartbeats__` undeclared key).
- If choosing Dragonfly, schedule a short queue soak test before production cutover.

---

Update policy for this file:
- Keep this as the single source of truth during this conversation.
- Append decisions, do not silently replace previous decisions.
