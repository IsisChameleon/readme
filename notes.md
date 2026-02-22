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


