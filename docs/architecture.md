# Readme -- Architecture & Tech Stack

This document captures the architectural decisions made during the design phase of the MVP.
It is the authoritative reference for technology choices and their rationale.

---

## Product Summary

**Readme** is a family reading app. Parents upload PDFs; children listen to them read aloud by
a voice AI bot. The child's entire experience is voice-driven -- no text input, no menus.
The parent experience is a minimal web dashboard.

**MVP scope**: web app (desktop + mobile browser). App Store distribution via Capacitor is planned
but post-MVP.

---

## User Flows

```
Parent:
  Landing -> [Sign in with Google] -> Dashboard
    -> upload PDF -> book appears in library
    -> manage child profiles (name only for MVP)

Child:
  [Parent hands device / child sees screen]
  -> clicks mini orb (always visible on dashboard corner)
  -> orb expands full-screen
  -> talks to bot -> "what shall we read?" / "read The BFG"
  -> bot reads, child can interrupt by speaking
  -> "keep reading" -> bot resumes
  -> 1x tap orb = pause/resume
  -> 2x tap orb = exit back to dashboard
```

Book selection is entirely voice-driven. No separate book-selection screen.
MVP skips per-child detection -- single household, one active session at a time.
Voice-based child detection is a post-MVP feature.

---

## Architecture Overview

```
Browser (Next.js)
  |
  |-- POST /start -----------------------> FastAPI /start
  |   returns: session_id,                      |
  |            room_id, token             Pipecat Cloud
  |                                              |
  +-- WebRTC (Daily) <-------------------------- Bot
      audio + RTVI events only                   |
      (transcripts, bot speaking state,          |
       interruptions, custom app events)         |
                                                 |-- Upstash Redis
                                                 |   fast context: session state,
                                                 |   reading checkpoints, book position
                                                 |
                                                 +-- Supabase
                                                     persistence: books, chunks,
                                                     profiles, reading progress
```

### Key rules

- The frontend holds no book data, no chunk data, no library state.
- The bot owns all reading logic and talks to Supabase directly.
- The only thing the frontend receives from /start is: session_id, room_id, token.
- From that point on, everything is WebRTC: audio, video, and RTVI events.
- Transcripts displayed in the UI arrive as RTVI events through WebRTC -- not from any API.
- Upstash Redis is bot-side only (bot <-> FastAPI). The frontend never touches Redis.
- The frontend makes exactly one HTTP call: POST /start.

---

## Frontend

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | Vercel-native, RSC for server data, API routes for proxying |
| Deployment | Vercel | Zero-config Next.js deployment |
| UI library | shadcn/ui | Copy-paste primitives, fully owned, Tailwind-based, customisable |
| Styling | Tailwind CSS v4 | Required with shadcn; utility-first |
| Animation | Framer Motion | Page transitions, orb pulse/expand, card hover -- essential for the whimsical feel |
| Fonts | Caveat (headings) + Nunito (body) | Handwritten feel for brand; rounded friendly sans for readability |
| Client state | Zustand | Holds Pipecat event state, orb mode, UI state |
| Server state | Next.js Server Components + fetch | Parent dashboard reads; no TanStack Query for MVP |
| Voice UI | Pipecat Voice UI Kit | Provides the multicolour animated orb component |
| Auth | Supabase Auth | Google OAuth, JWT, integrates directly with Supabase RLS policies |

### What was considered and not chosen

- **better-auth**: adds a dependency without benefit over Supabase Auth given the existing stack
- **TanStack Query**: deferred -- Server Components cover parent dashboard reads; add when pain is felt
- **Mantine**: good library but has its own styling system that conflicts with Tailwind

---

## Voice Session Architecture

The frontend is a thin WebRTC client. Its entire session lifecycle:

```
1. POST /start  ->  receive { session_id, room_id, token }
2. Connect to Daily room using token
3. Listen to RTVI events  ->  update Zustand  ->  drive UI
4. Send audio  ->  bot handles all logic
5. Disconnect (2x tap orb or session end)
```

The frontend holds no book data, no chunk data, no reading position.
The bot owns all reading logic, talks to Supabase directly, and emits RTVI events
for anything the UI needs to display (transcripts, bot state changes).

### RTVI events -> Zustand (rough shape)

```typescript
const useSessionStore = create((set) => ({
  orbState: 'idle',    // idle | speaking | listening | paused
  transcript: '',
  setOrbState: (state) => set({ orbState: state }),
  setTranscript: (text) => set({ transcript: text }),
}))

pipecatClient.on('botStartedSpeaking', () => useSessionStore.setState({ orbState: 'speaking' }))
pipecatClient.on('botStoppedSpeaking', () => useSessionStore.setState({ orbState: 'listening' }))
pipecatClient.on('transcript', ({ text }) => useSessionStore.setState({ transcript: text }))
```

---

## Upstash Redis (bot-side only)

Redis is used between the bot and FastAPI -- the frontend never touches it.

Use cases:
- Session context at bot startup (which book, which chunk, household id)
- Reading position checkpoints written periodically by the bot
- Fast lookups so the bot avoids hitting Supabase on every turn

---

## Data Access — Authoritative Split

```
Frontend  →  Supabase (anon key + user JWT + RLS)    reads: books, profiles, progress
Frontend  →  FastAPI                                  writes with business logic (upload → worker)
Bot       →  FastAPI  →  Supabase (service key)       all bot reads and writes
```

**Why frontend reads go direct to Supabase (and always will):**
- User JWT + RLS enforces the household security boundary automatically
- Parent dashboard reads are simple data reflections — no business logic
- This is the intended use of Supabase Auth + RLS
- A FastAPI proxy for reads would be a valueless thin wrapper

**Why bot reads go through FastAPI:**
- Bot runs server-side with a service key (no user JWT)
- Bot operations involve business logic: chunk retrieval, progress checkpointing, future RAG
- Caching, rate limiting, and observability belong at the service layer

This is the permanent architecture — not a MVP shortcut.

## Backend API (FastAPI)

Endpoints called from the frontend:

```
POST /start                   — initiate Pipecat call, returns { session_id, room_id, token }
POST /admin/books/upload      — upload PDF, triggers processing worker
```

No other FastAPI endpoints are called from the frontend.
The bot calls additional internal endpoints for its own orchestration.

---

## Persistence (Supabase)

| Table | Written by | Read by |
|---|---|---|
| books | Parent upload flow | Bot at session start, parent dashboard |
| book_chunks | Worker (PDF processing) | Bot during session |
| households | Auth flow | API everywhere |
| kids | Parent dashboard | Bot, parent dashboard |
| reading_progress | Bot at session end / checkpoint | Parent dashboard |

Auth: Supabase Auth with Google OAuth. JWT injected into all DB queries via RLS policies.
Clients never use service role keys. All DB access goes through FastAPI.

---

## Mobile Strategy

MVP: web app -- works in mobile browser and on desktop.

Post-MVP path to App Store: Capacitor
- Wraps the Next.js web app in a native shell
- Reuses 100% of existing code
- Voice / microphone / WebRTC works in a WebView
- No architecture changes required

What this means now: keep UI logic and business logic cleanly separated.
Do not intertwine Pipecat event handling with component rendering.

PWA support (manifest + service worker) to be added at MVP -- low effort,
gives installability on mobile browsers immediately.

---

## Design Language

Visual style: minimalist, hand-drawn marker aesthetic.
- Thin 1px strokes, sketchy roughness feel
- Warm cream background #FDFAF5 for parent screens
- Accent palette: coral #F28B70, sage #7DBE9E, lavender #B8A9D9, amber #F5C842
- Faint line-art illustrations (books, stars, moons) at low opacity in backgrounds
- Dark #0d0d0f background for the child reading session (makes orb pop)

Orb states:
- idle: slow gentle pulse
- speaking: morphing / animated multicolour
- listening: calm, waiting
- paused: dim, static

Orb interactions (no buttons -- touch/click only):
- 1x tap: pause / resume
- 2x tap: exit to parent dashboard

Child session is otherwise entirely voice-controlled:
- Speaking: interrupts the reading
- "keep reading": bot resumes from where it stopped
- "read [title]": selects a book from the household library

---

## Dependency List (Frontend)

```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "@pipecat-ai/client-react": "latest",
    "@pipecat-ai/voice-ui-kit": "latest",
    "@supabase/supabase-js": "latest",
    "@supabase/ssr": "latest",
    "framer-motion": "latest",
    "zustand": "latest",
    "tailwindcss": "^4",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

shadcn/ui components are copied into the repo (not installed as a package).

---

## Out of Scope for MVP

- Teams / multi-household sharing
- Per-child voice detection (one active session per household for MVP)
- Offline mode
- Push notifications
- Worker queues (PDF processing is synchronous for MVP)
- Full observability stack
- React Native / Expo port
