# Modal Infrastructure — Known Deviations from Spec

Tracked issues from code review on 2026-03-17.
Address before first production deploy.

## Must fix before prod deploy

### 1. No internal API key authentication
The spec requires `INTERNAL_API_KEY` bearer token validation on all Modal API
routes except `/health`. Not implemented — the Modal API URL is currently public.
**Spec section:** "Initial hardening (MVP)"

### 2. No client-side proxy for production
The spec says "Browser never calls the Modal API directly in production."
The Next.js `/api/start` proxy was removed. For production, either restore a
production-only proxy route or protect the Modal URL with the internal API key.
**Spec section:** "Initial hardening (MVP)"

### 3. GitHub Actions only deploys dev
Pushes to main deploy `dev`. Prod deployment via GitHub releases is not yet
configured. Low priority until first prod deploy.

## Deferred optimizations

### 4. `python-dotenv` may be stale in server deps
With pydantic-settings, `load_dotenv()` is no longer called in `config.py`.
Check if bot or other code still needs it before removing.
