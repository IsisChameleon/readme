
# Kid Reading Voice App – Prototype Plan (Updated)

This document replaces the previous version of the prototype plan
(see original: PROTOTYPE_PLAN.md).

------------------------------------------------------------
1. ARCHITECTURAL DECISIONS (FINALIZED)
------------------------------------------------------------

Database: Supabase (Postgres)
Auth: Supabase Auth
Storage: Supabase Storage
Voice Runtime: Pipecat Cloud
Transport: Daily WebRTC
Backend API: FastAPI
Frontend: Next.js (App Router)
Realtime call state: in-memory (Redis later)

Key rule:
Realtime voice state != database.
Database is persistence only.

------------------------------------------------------------
2. DOMAIN MODEL (6–12 MONTH HORIZON)
------------------------------------------------------------

Security boundary: Household

- Parent account creates a household.
- Household contains:
    - 1 parent (auth user)
    - 1+ kid profiles
    - Books uploaded by parent
    - Reading progress per kid per book

No teams.
No cross-household sharing.

------------------------------------------------------------
3. DATA MODEL (AUTHORITATIVE DIRECTION)
------------------------------------------------------------

households
- id (uuid, pk)
- created_at (timestamptz)

users (parents only)
- id (uuid, pk)
- household_id (uuid fk households)
- email (text)

kids
- id (uuid, pk)
- household_id (uuid fk households)
- display_name (text)

books
- id (uuid, pk)
- household_id (uuid fk households)
- title (text)
- storage_path (text)
- text_extracted (boolean)
- created_at (timestamptz)

reading_progress
- kid_id (uuid fk kids)
- book_id (uuid fk books)
- current_position (integer)
- updated_at (timestamptz)
- primary key (kid_id, book_id)

sessions (optional but recommended)
- id (uuid pk)
- kid_id
- book_id
- started_at
- ended_at
- summary

------------------------------------------------------------
4. ROW LEVEL SECURITY (CONCEPTUAL)
------------------------------------------------------------

Policy rule:

A parent may access all records where:
    table.household_id == jwt.household_id

A kid may:
    - Read books in their household
    - Update only their own reading_progress rows

Clients never use service role keys.
All DB access goes through FastAPI.

------------------------------------------------------------
5. STORAGE STRATEGY
------------------------------------------------------------

Supabase Storage bucket structure:

/{household_id}/books/{book_id}.pdf

Server responsibilities:
- Extract text
- Store processed text segments in DB

Future:
- Add pgvector embeddings table

------------------------------------------------------------
6. VOICE AGENT ARCHITECTURE
------------------------------------------------------------

Frontend
  → /api/start
  → Pipecat Cloud start endpoint
  → Daily WebRTC room
  → Bot runtime

IMPORTANT: /api/start is a frontend API route proxy.

Why proxy:
- Hides Pipecat Cloud public endpoint
- Keeps one stable frontend endpoint
- Allows switching local bot vs cloud bot via env only
- Avoids exposing service credentials to browser

The frontend always connects to "/api/start".
That route forwards request to:
- Local bot (dev), or
- Pipecat Cloud (prod)

------------------------------------------------------------
7. BOT PIPELINE STRUCTURE
------------------------------------------------------------

input audio
  → STT
  → interruption handler
  → context injection (book chunk)
  → LLM
  → TTS
  → output audio

allow_interruptions=True

On interruption:
- Cancel TTS
- Answer question grounded in book
- Resume reading from saved offset

------------------------------------------------------------
8. CALL STATE STRATEGY
------------------------------------------------------------

Prototype:
- In-memory session state
- Persist progress periodically or at session end

Future hardening:
- Redis session store
- Checkpoint every N seconds

------------------------------------------------------------
9. RAG EVOLUTION PATH
------------------------------------------------------------

Phase 1:
- Load full extracted text into context (single demo book)

Phase 2:
- Chunk text

Phase 3:
- Add table:
    book_chunks (id, book_id, chunk_index, text, embedding vector)

Use pgvector.

------------------------------------------------------------
10. FASTAPI ENDPOINTS
------------------------------------------------------------

Parent:
- POST /books/upload
- GET /books
- GET /progress/{kid_id}

Kid:
- GET /books
- GET /progress/{book_id}
- POST /progress/update

Bot internal:
- GET /bot/context/{kid_id}/{book_id}
- POST /bot/checkpoint

------------------------------------------------------------
11. MONOREPO STRUCTURE
------------------------------------------------------------

readme/
  client/    (Next.js)
  server/
    api/
    bot/
    shared/

------------------------------------------------------------
12. DEPLOYMENT
------------------------------------------------------------

Frontend: Vercel
Bot: Pipecat Cloud
API: Cloud Run / Fly / Railway
DB + Storage: Supabase

------------------------------------------------------------
13. OUT OF SCOPE
------------------------------------------------------------

- Teams
- Offline mode
- Worker queues
- Full observability stack
- Native mobile apps

------------------------------------------------------------
14. REFERENCES
------------------------------------------------------------

Supabase:
https://supabase.com/docs

Row Level Security:
https://supabase.com/docs/guides/auth/row-level-security

Supabase Storage:
https://supabase.com/docs/guides/storage

pgvector:
https://github.com/pgvector/pgvector

Pipecat:
https://docs.pipecat.ai

Pipecat Cloud:
https://docs.pipecat.ai/cloud

Daily WebRTC:
https://docs.daily.co

FastAPI:
https://fastapi.tiangolo.com

Next.js:
https://nextjs.org/docs/app

Vercel:
https://vercel.com/docs
