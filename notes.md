cd /Users/isabelleredactive/src/readme/server
uv sync
uv run python -m pipecat.runner.run -t webrtc


OR

cd /Users/isabelleredactive/src/readme/server
/Users/isabelleredactive/src/readme/server/.venv/bin/python /Users/isabelleredactive/src/readme/server/bot/bot.py -t webrtc

Open built-in tester at http://localhost:7860/client/.


FRONTEND

cd /Users/isabelleredactive/src/readme/client
pnpm install
pnpm dev

API

cd /Users/isabelleredactive/src/readme/server
uv run uvicorn api.main:app --reload --host 0.0.0.0 --port 8000


Last changes on Sunday

  Done:                                                                                   
  - Supabase CLI installed, supabase start running locally
  - 3 migrations applied (books, book_chunks, reading_progress)                           
  - Demo data seeded: 29 Alice in Wonderland chunks
  - docker-compose.yaml updated — api/bot/worker join supabase_network_readme external
  network, SUPABASE_URL points to http://supabase_kong_readme:8000
  - All 30 tests pass, lint/format clean

  Note:
  No — you don't need to add SUPABASE_URL to your .env.    
  It's set directly in docker-compose.yaml via the
  environment: block, which overrides anything in .env:    
                                                           
  # docker-compose.yaml lines 44, 66                       
  environment:                                 
    SUPABASE_URL: http://supabase_kong_readme:8000  # ← 
  takes precedence over .env

  To run the full stack:

  2. Run:
  docker compose up

  3. Connect via the client at http://localhost:3000 — the bot should greet with "Alice's
  Adventures in Wonderland", read aloud on confirmation, handle Q&A interruptions, and
  save progress on disconnect.

  Local Supabase URLs:
  - API: http://127.0.0.1:54321
  - Studio (DB browser): http://127.0.0.1:54323
  - DB direct: postgresql://postgres:postgres@127.0.0.1:54322/postgres

  --> you can find everything by just running "supabase status"

Funny way to query supabase:
   cd /Users/isabelleredactive/src/readme && SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SECR
   ET_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcn
   ZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" curl -s
   -H "apikey: $SUPABASE_SECRET_KEY" -H "Authorization: Bearer $SUPABASE_SECRET_KEY"
   "http://127.0.0.1:54321/rest/v1/books?select=id,title,status" 2>&1


# Mon 16 Mar - Deployment on Modal

## Actions done

from root folder:

uv run --project infra modal setup

from infra folder: (I think not necessary to run from infra but....)

uv run --project infra modal secret create readme-dev --force --from-dotenv ../server/.env.modal.dev

From root:

deploy the app
ENV=dev uv run --project infra modal deploy infra/main.py --stream-logs

```
✓ Created objects.
├── 🔨 Created mount 
│   /Users/isabelleredactive/src/readme/infra/modal_jobs.py
├── 🔨 Created mount 
│   /Users/isabelleredactive/src/readme/infra/modal_api.py
├── 🔨 Created mount /Users/isabelleredactive/src/readme
├── 🔨 Created web function serve_api => 
│   https://isischameleon--readme-dev-serve-api.modal.run
├── 🔨 Created function run_bot_session.
├── 🔨 Created function process_book.
└── 🔨 Created function rechunk_book.
✓ App deployed in 714.622s! 🎉

View Deployment: 
https://modal.com/apps/isischameleon/main/deployed/readme-de
v
```

export API_URL="https://isischameleon--readme-dev-serve-api.modal.run"

curl https://isischameleon--readme-dev-serve-api.modal.run
{"detail":"Not Found"}%     

curl https://isischameleon--readme-dev-serve-api.modal.run/health
{"status":"ok"}% 3

curl -X POST https://isischameleon--readme-dev-serve-api.modal.run/start
{"room_url":"https://cloud-2d2cdb957c27416f941784a1e3912b1d.daily.co/readme-9053c950f5924768b1a173f202a668d7","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyIjoicmVhZG1lLTkwNTNjOTUwZjU5MjQ3NjhiMWExNzNmMjAyYTY2OGQ3IiwidSI6InJlYWRlciIsIm8iOmZhbHNlLCJlanQiOnRydWUsImV4cCI6MTc3MzczOTYyNywiZCI6ImJjNWEzM2FmLTUyNmItNGVjOS1hNDRjLTI3ZjEyZGIzNGYzNiIsImlhdCI6MTc3MzczNzgyN30.t1wqw75qC_1ZzLiXc-jur5X3S1AbxFmaVlTGE3HcAn0"}%