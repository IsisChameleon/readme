# EmberTales Prototype v12 Integration Design

## Overview

Integrate the v0 prototype (EmberTales UI) into the existing readme codebase, replacing the current frontend while preserving the working Pipecat voice pipeline, FastAPI backend, and Supabase data layer.

**Approach:** Incremental layer-by-layer integration in 5 stages, each independently testable. The existing call flow stays intact throughout — we only swap the visual wrapper in the final stage.

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Kid profiles | Add `kids` table, kid selector UI | Extends current household model — books belong to household, progress per kid |
| Parent vs kid views | Two separate views (A) | Parent dashboard for management, kid home for reading |
| Voice session visuals | Plasma orb + new AnimatedOrb/Dragon as toggle (B) | Preserve working orb, add new option |
| Call flow | Keep existing Pipecat code | Prototype has no real call — trust our implementation |
| Routing | `/h/[householdId]/...` with nested kid routes | Supports future admin users viewing any household |
| API architecture | Keep FastAPI for writes, Supabase direct for reads | No Next.js API routes — avoid duplicating backend |
| API route params | No household_id in API paths | Derived from auth context; avoids IDOR bugs |
| Bot changes | Deferred — frontend only for now (B) | Build UI with placeholder events, wire to bot later |
| Text display source | Bot sends chunks via app messages (B) | Single source of truth, no sync issues |
| Stats | Show what's derivable now (A) | Book count + progress from existing data, defer time tracking |
| Design tokens | OKLCH with two themes | `ember` (prototype palette) + `classic` (current palette converted) |
| Fonts | Nunito (body) + Baloo 2 (display) | Drop Caveat, adopt prototype fonts |
| Kids table reads | Supabase direct + RLS | Consistent with books pattern |
| Create kid | FastAPI endpoint `POST /kids` | Write operations go through API for business logic |
| Types | Auto-generated from OpenAPI schema | Pre-commit hook regenerates `lib/api/schema.ts` |
| Upload UI | Prototype drag-and-drop, hitting existing FastAPI endpoint | Better UX, same backend |

---

## Stage 1: Foundation

### Design Tokens
- Replace current hex-based `globals.css` with OKLCH custom properties
- Two theme palettes via `data-theme` attribute:
  - `ember`: teal primary `oklch(0.6 0.14 180)`, coral accent `oklch(0.72 0.16 35)`, cream background `oklch(0.98 0.01 85)`
  - `classic`: current warm palette converted to OKLCH (`#FDFAF5` background, `#FF6B6B` coral, `#7DC4A6` sage, etc.)
- Themes are orthogonal to light/dark mode
- Fonts: Nunito (body) + Baloo 2 (display), loaded via `next/font/google`

### Database Migration
```sql
CREATE TABLE kids (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kids_household_id ON kids(household_id);
```
- RLS policy: `household_id = auth.uid()::text` for SELECT
- Frontend reads kids directly from Supabase (anon key + RLS)

### API Models
- Add `Kid` Pydantic model to FastAPI
- Add `POST /kids` endpoint (create kid with validation)
- Extend `Book` model if needed (`cover_color`, `cover_image_url`)
- Pre-commit hook regenerates `lib/api/schema.ts` with new types
- UI-only types (`ReadingMode`, `SessionState`, `AIReadsView`) live in a local `lib/types.ts`

---

## Stage 2: Routing

### New Route Structure
```
app/
  page.tsx                                → redirect to /h/{householdId}
  auth/callback/route.ts                  → unchanged
  h/[householdId]/
    page.tsx                              → mode selector
    dashboard/page.tsx                    → parent view
    kid/[kidId]/
      page.tsx                            → kid home
      call/page.tsx                       → voice session
```

### Route Protection
- Update `proxy.ts` to protect `/h/*` routes (require auth)
- Validate `householdId` belongs to authenticated user (or user is admin)
- Validate `kidId` belongs to that household

### Backward Compatibility
- `/` → redirect to `/h/{user's household_id}`
- `/dashboard` → redirect to `/h/{householdId}/dashboard`
- `/call` → removed or redirected

---

## Stage 3: Parent Dashboard

**Located at** `/h/[householdId]/dashboard/page.tsx`

### Layout
- Header: EmberTales logo + "Switch to Kid Mode" + Settings + Sign Out
- Kid selector: horizontal scrollable avatars from `kids` table
- Stats grid: books read (count), progress percentage — no time tracking yet
- Tabs:
  - **Book Library** — `BookCard` (parent variant: compact, delete/view dropdown)
  - **Upload Books** — prototype drag-and-drop `BookUpload`, hitting `POST /books/upload`
  - **Reading Progress** — per-book progress bars for selected kid

### Data Fetching
- Books: Supabase direct read (anon key + RLS)
- Kids: Supabase direct read (anon key + RLS)
- Reading progress: Supabase direct read, filtered by selected kid
- Create kid: `POST /kids` FastAPI endpoint

### Kid Management
- "Add Kid" button → dialog (name, avatar letter, color picker)
- Full profile editing deferred

---

## Stage 4: Kid Home

**Located at** `/h/[householdId]/kid/[kidId]/page.tsx`

### Layout
- Header: back button (→ mode selector), EmberTales logo, stars/XP (placeholder)
- Welcome: EmberDragon (size="md") + "Hi, {kidName}!" + tagline
- "Continue Reading": books filtered by in-progress
- "My Books": full grid of household books

### Data Fetching
- Kid profile: Supabase direct read (RLS)
- Books: Supabase direct read (household-level)
- Reading progress: Supabase direct read filtered by `kidId`

### Interactions
- Click book → `/h/{householdId}/kid/{kidId}/call?bookId={bookId}`
- Back → `/h/{householdId}`

---

## Stage 5: Voice Session

**Located at** `/h/[householdId]/kid/[kidId]/call/page.tsx`

### Core Principle
Keep existing Pipecat call flow intact. Prototype UI is a new visual layer on top.

### What Stays (Current Code)
- `PipecatAppBase` wrapper for connection lifecycle
- Pipecat client events (`botStartedSpeaking`, `botStoppedSpeaking`, `botTranscript`, `userTranscript`)
- Session creation via `POST /start` FastAPI endpoint
- Connection state management

### What Gets Added (Prototype)
- `EmberDragon` component reacting to speaking/listening state
- `AnimatedOrb` as alternative to Plasma orb (user toggle)
- Two reading mode layouts (placeholder until bot changes):
  - `ai-reads`: immersive view (full-bleed image + orb) or text+image view (side-by-side with karaoke highlighting)
  - `kid-reads`: large text display + listening indicator + bot feedback bubble
- Chapter sidebar drawer
- Header: book title, controls (pause, mute, chapters, close)
- Word-level karaoke highlighting UI (ready, driven by mock until bot sends events)

### Visual Toggle
Setting or button to switch between Plasma orb and AnimatedOrb + Dragon. Both use same Pipecat event stream.

### Text Display
- UI renders chunk text received via bot app messages (RTVI)
- Until bot sends those, show orb/dragon view only
- Voice session works immediately with current bot (orb mode)
- Gains text display when bot changes land

### Query Params
`?bookId={id}` passed to session creation. Bot uses this to load the book.

---

## Components from Prototype

### Keep As-Is (pure UI, no simulation)
- `ember-dragon.tsx` — animated SVG dragon, responds to `isListening`/`isSpeaking` props
- `book-card.tsx` — two variants (parent/kid), minor cover image enhancement
- `kid-selector.tsx` — horizontal avatar picker

### Adapt (replace mock data, wire to real sources)
- `kid-home.tsx` → new route page, Supabase data fetching
- `parent-dashboard.tsx` → new route page, real data + existing API
- `book-upload.tsx` → keep drag-and-drop UI, point to existing FastAPI upload endpoint
- `voice-session.tsx` → wrap existing Pipecat call flow, add new visual layers

### Drop Entirely
- All `MOCK_*` constants
- All `simulate*` functions and setTimeout-based behaviors
- Prototype's suggested Daily.co direct integration (we use Pipecat)
- Prototype's suggested Next.js API routes (we use FastAPI)

---

## Open Questions for Implementation

1. **Book cover images** — Do we add `cover_color` / `cover_image_url` columns to the `books` table now, or use generated colors based on book title hash?
2. **Stars/XP system** — What drives the XP counter on kid home? Placeholder for now, but what's the future plan?
3. **Theme persistence** — Where to store theme preference? Cookie, Supabase user settings, or localStorage?
4. **Kid avatar options** — Just a letter + color, or do we want emoji/image avatars?
5. **Dark mode** — The prototype has dark mode tokens. Do we support it or keep light-only for now?
