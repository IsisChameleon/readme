# Migrate Bot from Modal to Pipecat Cloud + Fix Conversation Bugs

## Context

The voice bot currently runs on Modal but suffers from three issues observed in a real session:
1. **UUID truncation** — the LLM truncated the book UUID when calling `select_book`, causing "Book not found" twice
2. **Race condition** — user's first "Hello" was processed before `client-ready`, so the LLM had no system prompt
3. **Deepgram STT stalls** — mid-session TTFB of 7–19 seconds, likely Modal networking

Pipecat Cloud (PCC) is already partially set up (`pcc-deploy.toml`, Dockerfile, CI workflow) but deployment fails with a 401 auth error. This plan completes the migration: bot moves to PCC, API + workers stay on Modal.

---

## Phase 1: Fix the two bot bugs (independent of PCC migration)

### 1a. Fix UUID truncation — use numeric book indices instead of UUIDs

The LLM called `select_book("7a81adda-f911-4871-9ffe-148903a25b")` — missing `0a` from the real UUID. Fix: use short numeric indices (`"1"`, `"2"`) that the state manager resolves to full UUIDs.

**`server/bot/processors/state_manager.py`**
- Add `self._book_index_map: dict[str, str] = {}` in `__init__`
- In `enter_book_selection()` (line 92–101): build the index map and change the prompt to use `index=1` instead of `id=<uuid>`
- Add `resolve_book_id(raw_id: str) -> str` method that looks up the index map, falls back to raw_id

**`server/bot/bot.py`**
- In `_build_tools()`: change `book_id` description to `"The numeric index of the book (e.g. '1') as shown in the book list"`
- In `handle_select_book`: resolve via `state_manager.resolve_book_id(params.arguments["book_id"])`
- In `handle_start_reading`: same resolution

**`server/bot/prompt.py`**
- In `BOOK_SELECTION_SYSTEM`: change `call select_book(book_id)` to `call select_book(book_index)` in the instruction text
- Similarly update `QA_SYSTEM` and `FINISHED_SYSTEM` references

### 1b. Fix race condition — inject placeholder system prompt before any audio

Currently, the LLM context starts empty. The real system prompt is injected in `on_client_ready` → `enter_book_selection()`. If audio arrives before that event, the LLM runs with no system prompt.

**`server/bot/bot.py`** (around line 106, after `context = LLMContext(tools=tools)`)
- Set a placeholder system prompt:
```python
context.set_messages([{
    "role": "system",
    "content": "You are a friendly reading companion. Please wait a moment while we get your books ready."
}])
```
This ensures any early audio gets a sensible (if generic) response. When `enter_book_selection()` fires, `_replace_system_prompt()` replaces it.

---

## Phase 2: Adapt bot for Pipecat Cloud

### 2a. Update `bot()` signature

PCC calls `bot(runner_args)` with custom data in `runner_args.body`. Currently `bot()` takes `book_id` and `kid_id` as keyword args.

**`server/bot/bot.py`** — change `bot()` (line 206):
```python
async def bot(runner_args: RunnerArguments, book_id: str | None = None, kid_id: str | None = None):
    body = getattr(runner_args, "body", None) or {}
    book_id = book_id or body.get("book_id")
    kid_id = kid_id or body.get("kid_id")
    ...
```
This keeps backward compat with Modal (which passes kwargs) while supporting PCC (which uses `runner_args.body`).

### 2b. Fix Dockerfile to include shared modules

The bot imports from `shared/` (e.g. `shared.supabase`). Currently only `./bot` is copied.

**`server/bot/Dockerfile`** — add shared code and settings:
```dockerfile
COPY ./bot ./bot
COPY ./shared ./shared
COPY ./settings.toml .
```

---

## Phase 3: Wire API to forward to Pipecat Cloud

### 3a. Add PCC config to settings

**`server/shared/config.py`** — add:
```python
class PipecatCloudSettings(LazySecretsSettings):
    public_key: str = ""
    agent_name: str = "readme-bot-dev"
    api_base_url: str = "https://api.pipecat.daily.co/v1"
```
Add `pipecat_cloud: PipecatCloudSettings = PipecatCloudSettings()` to `Settings`.

**`server/settings.toml`** — add:
```toml
[pipecat_cloud]
public_key = "${PIPECAT_PUBLIC_KEY}"
agent_name = "readme-bot-dev"
```

### 3b. Update `/start` route to support PCC

**`server/api/routers/start.py`** — add a PCC branch before the Modal branch:

```python
if settings.pipecat_cloud.public_key:
    data = await _start_via_pcc(book_id, kid_id)
    return StartSessionResponse(room_url=data["dailyRoom"], token=data["dailyToken"])
elif settings.modal.app_name:
    # existing Modal path (kept as fallback)
    ...
else:
    # local bot runner (docker-compose dev)
    ...
```

The `_start_via_pcc()` function POSTs to `{api_base_url}/public/{agent_name}/start` with:
- Header: `Authorization: Bearer {public_key}`
- Body: `{"createDailyRoom": true, "body": {"book_id": ..., "kid_id": ...}}`

---

## Phase 4: Fix PCC CI and auth

### 4a. Fix the 401 error (manual ops steps)

1. Re-authenticate: `pcc auth login`
2. Verify org: `pcc organizations list`
3. Create public key if missing: `pcc organizations keys create readme-dev --organization stormy-badger-olive-971`
4. Create/update secret set: `pcc secrets set readme-dev` with all required keys (OPENAI_API_KEY, DEEPGRAM_API_KEY, CARTESIA_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY)
5. Update GitHub secret `PIPECAT_TOKEN` in the `dev` environment
6. Add GitHub secret `PIPECAT_DEFAULT_PUBLIC_KEY` with the `pk_xxx` value
7. Add `PIPECAT_PUBLIC_KEY` to the Modal secret set `readme-dev` (so the API server can forward to PCC)

### 4b. Simplify CI key resolution

**`.github/workflows/deploy-pipecat-dev.yml`** — replace the fragile awk-based key resolution (lines 64–75) with a direct secret reference:
```yaml
env:
  PIPECAT_DEFAULT_PUBLIC_KEY: ${{ secrets.PIPECAT_DEFAULT_PUBLIC_KEY }}
```
And a simple validation step instead of the awk parsing.

---

## Phase 5: Modal cleanup (after PCC is verified)

**`infra/modal_jobs.py`** — remove `BotSession` class and `run_bot_session` function. Keep `process_book` and `rechunk_book` workers.

**`infra/common.py`** — remove `bot_image`. Keep `api_image` and `worker_image`.

**`.github/workflows/deploy-modal.yml`** — narrow trigger paths to exclude `server/bot/**`.

**`server/api/routers/start.py`** — remove the Modal branch once PCC is confirmed working.

---

## Verification

1. **Unit test UUID resolution**: call `state_manager.resolve_book_id("1")` returns the correct UUID
2. **Race condition**: start a session and verify the first LLM call always includes a system prompt (check bot logs for the context array)
3. **PCC deploy**: run `pcc auth login`, then `pcc deploy` locally, verify agent status
4. **End-to-end**: start a voice session from the client, verify:
   - Bot greets with book list (not generic "How can I assist you")
   - `select_book("1")` succeeds (check logs for correct UUID resolution)
   - Book reading starts successfully
   - No Deepgram STT stalls >2s

---

## Key files

| File | Changes |
|------|---------|
| `server/bot/bot.py` | bot() signature, placeholder prompt, tool descriptions, book_id resolution |
| `server/bot/processors/state_manager.py` | `_book_index_map`, `resolve_book_id()`, index-based prompt |
| `server/bot/prompt.py` | Update tool call references from UUID to index |
| `server/bot/Dockerfile` | Copy shared/ and settings.toml |
| `server/api/routers/start.py` | Add PCC forwarding branch |
| `server/shared/config.py` | Add `PipecatCloudSettings` |
| `server/settings.toml` | Add `[pipecat_cloud]` section |
| `.github/workflows/deploy-pipecat-dev.yml` | Simplify key resolution |
| `infra/modal_jobs.py` | Remove bot code (Phase 5) |
| `infra/common.py` | Remove bot_image (Phase 5) |
