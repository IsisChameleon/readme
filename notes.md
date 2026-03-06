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

