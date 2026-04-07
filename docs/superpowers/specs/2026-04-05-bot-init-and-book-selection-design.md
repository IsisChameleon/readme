# Bot Initialization & Book Selection Redesign

## Problem

Three bugs observed in a real voice session (2026-04-05):

1. **Race condition:** `LLMContext` starts empty. System prompt is only injected on `on_client_ready` (~0.7s after audio capture starts). If the user speaks in that gap, the LLM produces a generic response with no personality or book info. The user hears two greetings back-to-back.

2. **UUID truncation:** The LLM truncated the book UUID when calling `select_book` (`148903a0a25b` → `148903a25b`), causing "Book not found" twice. The LLM cannot reliably copy 36-character UUIDs.

3. **Deepgram STT stalls:** Mid-session TTFB of 7–19 seconds. Likely a Modal networking issue — expected to resolve with Pipecat Cloud migration (separate workstream).

## Design

### Core principle: system prompt exists before any audio flows

The `LLMContext` is created with a complete system prompt at pipeline construction time. The context is never empty. This follows the pattern used in `toocan-app/server/src/core/call/bot.py:189-191`.

### Unified `bot()` signature — always use `runner_args.body`

`body` is a field on the base `RunnerArguments` class (pipecat 0.0.104+), available across all deployment targets. The `bot()` function always reads `book_id` and `kid_id` from `runner_args.body`:

```python
async def bot(runner_args: RunnerArguments):
    body = runner_args.body or {}
    book_id = body.get("book_id")
    kid_id = body.get("kid_id")
```

No keyword args, no deployment-specific branching.

Callers pass data via `body`:
- **Pipecat Cloud:** `body` is auto-populated from the `/start` request payload
- **Modal:** `DailyRunnerArguments(room_url=..., token=..., body={"book_id": ..., "kid_id": ...})`
- **Local (docker-compose):** Pipecat runner forwards the HTTP body into `runner_args.body` automatically

### Two startup flows

**Flow A — `book_id` provided (common path, selected from dashboard):**

No Supabase queries block startup. The system prompt includes the `book_id` and instructions to call `select_book("1")` to load it. The bot doesn't know the title yet — the `select_book` handler returns it.

On `on_client_connected`: push an `LLMMessagesAppendFrame` with a nudge to greet and offer to read. The bot greets immediately.

When the LLM calls `select_book`, the handler loads chunks + progress from Supabase:
- **Has progress:** Handler returns progress info. The LLM recaps and asks to confirm.
- **No progress (new book):** Handler returns "new book". The LLM gives a brief intro and auto-starts by calling `start_reading`.

**Flow B — no `book_id` (browse mode):**

System prompt says to use `list_books()` to see what's available.

On `on_client_connected`: same nudge. The bot greets and calls `list_books`. While the query runs, the bot can say "Let me check what stories we have today..."

### New tool: `list_books`

```
name: list_books
description: Fetch the list of available books for this child.
properties: {}
required: []
```

Handler calls `library.get_books_with_progress()`, populates `_book_index_map`, and returns a formatted string with numeric indices:
```
Available books:
1. "David and the Phoenix" (in progress — last read about David climbing the mountain)
2. "Charlotte's Web" (new)
```

### UUID fix: numeric indices everywhere

Books are identified by short numeric indices (`"1"`, `"2"`) in all tool calls.

- `state_manager._book_index_map: dict[str, str]` maps index → full UUID
- Populated when `list_books` returns, or when a single book is loaded via Flow A (index "1")
- `state_manager.resolve_book_id(raw_id)` looks up the map, falls through to raw_id
- Tool descriptions say `"The numeric index of the book (e.g. '1')"`
- `select_book` and `start_reading` handlers resolve indices before passing to `library`

### Event handler changes

**Before (current):**
```
on_client_connected  → log only
on_client_ready      → enter_book_selection() (fetches books, sets system prompt, triggers greeting)
```

**After:**
```
on_client_connected  → trigger greeting via LLMMessagesAppendFrame(run_llm=True)
on_client_ready      → log only
```

### System prompt templates

**Flow A (book_id provided):**
```
You are a friendly, warm reading companion for children.
You speak clearly and encouragingly. Keep your responses concise and age-appropriate.

A book has been pre-selected for this session (index=1).
Call select_book("1") to load it and check the child's reading progress.

After loading:
- If the child has reading progress, summarize where they left off in one sentence
  and ask if they want to continue.
- If the book is new, give a brief exciting intro and start reading by calling
  start_reading("1").

Do NOT read the book text yourself — the system handles reading aloud automatically
after you call start_reading.

If the child hints at leaving, ask a short confirmation before calling end_session().
```

**Flow B (no book_id):**
```
You are a friendly, warm reading companion for children.
You speak clearly and encouragingly. Keep your responses concise and age-appropriate.

You don't know which books are available yet. Call list_books() first to see what
this child can read. While waiting, greet the child warmly.

After getting the book list, present the options and let the child choose.
When the child picks a book, call select_book(index) with the numeric index.

Do NOT read the book text yourself — the system handles reading aloud automatically
after you call start_reading.

If the child hints at leaving, ask a short confirmation before calling end_session().
```

## Pipecat Cloud wiring (bundled)

The bot init fix makes `bot()` PCC-compatible (`runner_args.body`). The remaining PCC plumbing:

### API forwards to PCC

`server/api/routers/start.py` — add a PCC branch before the Modal branch:

```python
if settings.pipecat_cloud.public_key:
    # POST to PCC public endpoint with auth header
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

### Config additions

`server/shared/config.py`:
```python
class PipecatCloudSettings(LazySecretsSettings):
    public_key: str = ""
    agent_name: str = "readme-bot-dev"
    api_base_url: str = "https://api.pipecat.daily.co/v1"
```

`server/settings.toml`:
```toml
[pipecat_cloud]
public_key = "${PIPECAT_PUBLIC_KEY}"
agent_name = "readme-bot-dev"
```

### Dockerfile fix

`server/bot/Dockerfile` — bot imports from `shared/`, which isn't copied currently:
```dockerfile
COPY ./bot ./bot
COPY ./shared ./shared
COPY ./settings.toml .
```

### CI simplification

`.github/workflows/deploy-pipecat-dev.yml` — replace fragile awk-based key resolution with a direct GitHub secret `PIPECAT_DEFAULT_PUBLIC_KEY`.

### Manual ops steps (not code — user does these)

1. `pcc auth login` to refresh token
2. Create `readme-dev` public key in org if missing
3. Update GitHub secrets: `PIPECAT_TOKEN`, `PIPECAT_DEFAULT_PUBLIC_KEY`
4. Add `PIPECAT_PUBLIC_KEY` to Modal secret set (so API can forward to PCC)

## Files to modify

| File | Change |
|------|--------|
| `server/bot/bot.py` | Read from `runner_args.body`; build system prompt at context creation; move greeting to `on_client_connected`; add `list_books` tool; resolve book indices in handlers |
| `server/bot/processors/state_manager.py` | Add `_book_index_map` + `resolve_book_id()`; replace `enter_book_selection()` with a simpler greeting method; populate index map from tool results |
| `server/bot/prompt.py` | Add `FLOW_A_SYSTEM` and `FLOW_B_SYSTEM` templates; update `QA_SYSTEM` and `FINISHED_SYSTEM` to use indices instead of UUIDs |
| `server/bot/library.py` | No changes (data access layer stays the same) |
| `infra/modal_jobs.py` | Pass `book_id`/`kid_id` via `body={}` dict instead of keyword args |
| `server/api/routers/start.py` | Add PCC forwarding branch with auth header |
| `server/shared/config.py` | Add `PipecatCloudSettings` |
| `server/settings.toml` | Add `[pipecat_cloud]` section |
| `server/bot/Dockerfile` | Copy `shared/` and `settings.toml` |
| `.github/workflows/deploy-pipecat-dev.yml` | Simplify key resolution to use direct secret |

## What this does NOT change

- The reading pipeline (STT → LLM → StateManager → TTS) stays the same
- `start_reading`, `end_session` tool handlers stay the same (except index resolution)
- The state machine (BOOK_SELECTION → READING → QA → FINISHED) stays the same
- Client-side code doesn't change
- Modal bot code stays in place (marked deprecated), not removed — kept as fallback if PCC doesn't work out
