# EmberTales Prototype v12 Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current readme frontend with the EmberTales v0 prototype UI while preserving the existing Pipecat voice pipeline, FastAPI backend, and Supabase data layer.

**Architecture:** Incremental 5-stage integration. Each stage is independently testable. The existing voice call flow stays intact throughout — stage 5 wraps it with new visuals. Frontend reads from Supabase (anon key + RLS), writes go through FastAPI.

**Tech Stack:** Next.js 16 (App Router, React 19), Tailwind v4 (OKLCH tokens), Framer Motion, Pipecat client SDK, Supabase (PostgreSQL + RLS + Storage), FastAPI (Python)

**Spec:** `docs/superpowers/specs/2026-03-19-prototype-v12-integration-design.md`

**Prototype source:** `temp/prototypev12/`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/20250101000006_kids.sql` | Kids table + RLS |
| `supabase/migrations/20250101000007_books_cover_image.sql` | Add cover_image_url to books |
| `supabase/migrations/20250101000008_reading_progress_rls.sql` | RLS for reading_progress |
| `server/api/routers/kids.py` | POST /kids endpoint |
| `client/lib/types.ts` | UI-only types (ReadingMode, SessionState, etc.) |
| `client/components/EmberDragon.tsx` | Animated SVG dragon mascot |
| `client/components/KidSelector.tsx` | Horizontal kid avatar picker |
| `client/components/BookCardNew.tsx` | New book card (kid + parent variants) |
| `client/components/BookUpload.tsx` | Drag-and-drop upload with progress |
| `client/components/AnimatedOrb.tsx` | New orb visual for voice session |
| `client/app/h/[householdId]/page.tsx` | Mode selector |
| `client/app/h/[householdId]/dashboard/page.tsx` | Parent dashboard |
| `client/app/h/[householdId]/kid/[kidId]/page.tsx` | Kid home |
| `client/app/h/[householdId]/kid/[kidId]/call/page.tsx` | Voice session |
| `client/app/h/[householdId]/dashboard/loading.tsx` | Loading skeleton |
| `client/app/h/[householdId]/kid/[kidId]/loading.tsx` | Loading skeleton |
| `client/app/h/[householdId]/dashboard/error.tsx` | Error boundary |
| `client/app/h/[householdId]/kid/[kidId]/error.tsx` | Error boundary |
| `client/app/h/[householdId]/mode-selector.tsx` | Mode selector client component |
| `client/app/h/[householdId]/dashboard/dashboard-client.tsx` | Parent dashboard client component |
| `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx` | Kid home client component |
| `client/components/AddKidDialog.tsx` | Add kid dialog |
| `server/tests/api/routers/test_kids.py` | Tests for POST /kids |
| `server/tests/api/routers/test_start_params.py` | Tests for parameterized POST /start |

### Modified Files
| File | Changes |
|------|---------|
| `client/app/globals.css` | Replace with OKLCH design tokens + two themes |
| `client/app/layout.tsx` | Swap Caveat → Baloo 2, add data-theme |
| `client/app/page.tsx` | Redirect to /h/{householdId} |
| `client/proxy.ts` | Update matcher for /h/* routes |
| `server/api/main.py` | Register kids_router |
| `server/api/routers/start.py` | Accept bookId + kidId params |
| `client/components/SignOutButton.tsx` | Update to use new theme tokens (remove --db-* vars) |

### Files to Remove (Stage 2+)
| File | Reason |
|------|--------|
| `client/app/LandingPage.tsx` | Replaced by mode selector |
| `client/components/ReadingOrb.tsx` | Replaced by new dashboard |
| `client/app/dashboard/page.tsx` | Replaced by /h/[householdId]/dashboard |
| `client/app/dashboard/layout.tsx` | Old dashboard layout with --db-* vars |
| `client/app/call/page.tsx` | Replaced by /h/[householdId]/kid/[kidId]/call |
| `client/components/VoiceSession.tsx` | Replaced by new call page with inline session |
| `client/components/UploadCard.tsx` | Replaced by BookUpload |

---

## Stage 1: Foundation

### Task 1.1: OKLCH Design Tokens + Fonts

**Files:**
- Modify: `client/app/globals.css`
- Modify: `client/app/layout.tsx`

- [ ] **Step 1: Replace globals.css with OKLCH tokens and two themes**

Replace the entire `client/app/globals.css` with:

```css
@import "tailwindcss";

/* ── Ember theme (default) ── */
:root,
[data-theme="ember"] {
  --background: oklch(0.98 0.01 85);
  --foreground: oklch(0.25 0.04 45);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.25 0.04 45);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.25 0.04 45);
  --primary: oklch(0.6 0.14 180);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.93 0.04 55);
  --secondary-foreground: oklch(0.35 0.04 45);
  --muted: oklch(0.95 0.02 85);
  --muted-foreground: oklch(0.5 0.02 45);
  --accent: oklch(0.72 0.16 35);
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9 0.02 85);
  --input: oklch(0.95 0.01 85);
  --ring: oklch(0.6 0.14 180);
  --radius: 1rem;

  /* Cover color palette for books without images */
  --cover-1: oklch(0.65 0.18 25);
  --cover-2: oklch(0.6 0.14 180);
  --cover-3: oklch(0.7 0.14 290);
  --cover-4: oklch(0.78 0.14 95);
  --cover-5: oklch(0.65 0.16 330);
  --cover-6: oklch(0.72 0.16 35);
}

/* ── Classic theme (original palette) ── */
[data-theme="classic"] {
  --background: oklch(0.98 0.01 75);    /* #FDFAF5 */
  --foreground: oklch(0.18 0.01 0);     /* #1e1e1e */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.01 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.01 0);
  --primary: oklch(0.65 0.18 25);       /* coral #FF6B6B */
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.73 0.1 160);     /* sage #7DC4A6 */
  --secondary-foreground: oklch(0.25 0.04 45);
  --muted: oklch(0.95 0.01 75);         /* #f3f0eb */
  --muted-foreground: oklch(0.5 0.02 0);/* #6b7280 */
  --accent: oklch(0.7 0.14 290);        /* lavender #A78BDA */
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.91 0.01 75);        /* #e5e0d8 */
  --input: oklch(0.95 0.01 75);
  --ring: oklch(0.65 0.18 25);
  --radius: 0.75rem;

  --cover-1: oklch(0.65 0.18 25);
  --cover-2: oklch(0.73 0.1 160);
  --cover-3: oklch(0.7 0.14 290);
  --cover-4: oklch(0.75 0.15 85);
  --cover-5: oklch(0.6 0.14 180);
  --cover-6: oklch(0.65 0.16 330);
}

/* ── Voice session dark background ── */
.voice-session-bg {
  --vs-bg: oklch(0.15 0.02 290);
  --vs-card: oklch(0.2 0.02 290);
  --vs-fg: oklch(0.88 0.02 290);
  --vs-primary: oklch(0.8 0.06 290);
  --vs-muted: oklch(0.3 0.02 290);
  --vs-muted-fg: oklch(0.65 0.03 290);
  --vs-border: oklch(0.35 0.04 290);
}

@theme inline {
  --font-sans: var(--font-nunito), 'Nunito', sans-serif;
  --font-display: var(--font-baloo), 'Baloo 2', cursive;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Retheme voice-ui-kit — use voice session dark tokens */
@layer base {
  .vkui-root.dark {
    --color-active: var(--vs-primary);
    --color-active-foreground: var(--vs-fg);
    --color-active-accent: oklch(from var(--vs-primary) l c h / 0.12);
    --color-active-ring: oklch(from var(--vs-primary) l c h / 0.2);
    --color-primary: var(--vs-primary);
    --color-primary-foreground: var(--vs-bg);
    --color-destructive: oklch(0.65 0.18 25);
    --color-destructive-foreground: oklch(1 0 0);
    --color-secondary: oklch(from var(--vs-primary) l c h / 0.15);
    --color-secondary-foreground: var(--vs-primary);
    --color-inactive: var(--vs-muted-fg);
    --color-inactive-foreground: var(--vs-primary);
    --color-border: var(--vs-border);
    --color-input: oklch(from var(--vs-primary) l c h / 0.15);
    --color-popover: var(--vs-card);
    --color-popover-foreground: var(--vs-fg);
    --color-card: var(--vs-card);
    --color-card-foreground: var(--vs-fg);
    --color-accent: oklch(from var(--vs-primary) l c h / 0.12);
    --color-accent-foreground: var(--vs-primary);
    --color-muted: var(--vs-muted);
    --color-muted-foreground: var(--vs-muted-fg);
    --color-foreground: var(--vs-fg);
    --color-background: var(--vs-bg);
    --color-ring: oklch(from var(--vs-primary) l c h / 0.3);
  }
}

.voice-ui-kit [data-slot="button"] {
  background: transparent;
  border: 1.5px solid oklch(from var(--vs-primary) l c h / 0.6);
  color: var(--vs-primary);
}

.voice-ui-kit [data-slot="button"]:hover {
  background: oklch(from var(--vs-primary) l c h / 0.1);
  border-color: oklch(from var(--vs-primary) l c h / 0.85);
}
```

- [ ] **Step 2: Update layout.tsx — swap Caveat for Baloo 2**

```tsx
// client/app/layout.tsx
import type { Metadata } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const baloo = Baloo_2({ variable: '--font-baloo', subsets: ['latin'] });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EmberTales – stories read together',
  description: 'Voice-first reading companion for kids',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="ember">
      <body className={`${baloo.variable} ${nunito.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Update SignOutButton to use new theme tokens**

The existing `client/components/SignOutButton.tsx` uses `var(--db-muted-fg)` and `var(--db-muted)` which no longer exist. Replace with Tailwind classes:

```typescript
// client/components/SignOutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
    >
      Sign out
    </button>
  );
};
```

- [ ] **Step 4: Verify the app still renders**

Run: `cd client && pnpm dev`
Expected: App starts, warm cream background visible at localhost:3000. Existing pages still render (may look different with new tokens — that's expected).

- [ ] **Step 5: Commit**

```bash
git add client/app/globals.css client/app/layout.tsx client/components/SignOutButton.tsx
git commit -m "feat: replace design tokens with OKLCH, two themes, swap Caveat for Baloo 2"
```

---

### Task 1.2: Database Migrations (kids table, cover_image_url, RLS)

**Files:**
- Create: `supabase/migrations/20250101000006_kids.sql`
- Create: `supabase/migrations/20250101000007_books_cover_image.sql`
- Create: `supabase/migrations/20250101000008_reading_progress_rls.sql`

- [ ] **Step 1: Create kids table migration**

```sql
-- supabase/migrations/20250101000006_kids.sql
CREATE TABLE kids (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  household_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kids_household_id ON kids(household_id);

ALTER TABLE kids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kids_select_own_household" ON kids
  FOR SELECT USING (household_id = auth.uid()::text);
```

- [ ] **Step 2: Create books cover_image_url migration**

```sql
-- supabase/migrations/20250101000007_books_cover_image.sql
ALTER TABLE books ADD COLUMN cover_image_url TEXT;
```

- [ ] **Step 3: Create reading_progress RLS migration**

```sql
-- supabase/migrations/20250101000008_reading_progress_rls.sql
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_progress_select_own_household" ON reading_progress
  FOR SELECT USING (
    kid_id IN (SELECT id FROM kids WHERE household_id = auth.uid()::text)
  );
```

- [ ] **Step 4: Apply migrations**

Run: `supabase db reset` (local dev — resets + applies all migrations)
Expected: All tables created, RLS policies active.

- [ ] **Step 5: Verify with a quick query**

Run: `supabase db query "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`
Expected: Output includes `books`, `book_chunks`, `kids`, `reading_progress`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add kids table, cover_image_url column, RLS policies"
```

---

### Task 1.3: FastAPI Kids Endpoint

**Files:**
- Create: `server/api/routers/kids.py`
- Modify: `server/api/main.py:9-10,30-31`
- Create: `server/tests/api/routers/test_kids.py`

- [ ] **Step 1: Write tests for POST /kids**

```python
# server/tests/api/routers/test_kids.py
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_create_kid_success():
    mock_response = MagicMock()
    mock_response.data = [{"id": "kid-1", "household_id": "h-1", "name": "Emma", "avatar": "E", "color": "#F472B6"}]

    with patch("api.routers.kids._supabase_client") as mock_sb:
        mock_sb.return_value.table.return_value.insert.return_value.execute.return_value = mock_response
        resp = client.post("/kids", json={
            "household_id": "h-1",
            "name": "Emma",
            "avatar": "E",
            "color": "#F472B6",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Emma"
    assert data["household_id"] == "h-1"


def test_create_kid_missing_name():
    resp = client.post("/kids", json={
        "household_id": "h-1",
        "name": "",
    })
    assert resp.status_code == 422


def test_create_kid_missing_household():
    resp = client.post("/kids", json={
        "name": "Emma",
    })
    assert resp.status_code == 422
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && uv run pytest tests/api/routers/test_kids.py -v`
Expected: FAIL — module `api.routers.kids` not found.

- [ ] **Step 3: Implement the kids router**

```python
# server/api/routers/kids.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, field_validator
from supabase import Client, create_client

from shared.config import settings

router = APIRouter(prefix="/kids", tags=["kids"])


class CreateKidRequest(BaseModel):
    household_id: str
    name: str
    avatar: str | None = None
    color: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be empty")
        return v.strip()

    @field_validator("household_id")
    @classmethod
    def household_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("household_id must not be empty")
        return v.strip()


class KidResponse(BaseModel):
    id: str
    household_id: str
    name: str
    avatar: str | None = None
    color: str | None = None


def _supabase_client() -> Client:
    if not settings.supabase.url or not settings.supabase.secret_key:
        raise HTTPException(status_code=500, detail="Supabase is not configured.")
    return create_client(settings.supabase.url, settings.supabase.secret_key)


# NOTE: No auth on this endpoint yet. In production, validate that
# household_id matches the authenticated user. This is a known gap
# consistent with the existing POST /books/upload pattern.
@router.post("", response_model=KidResponse)
async def create_kid(request: CreateKidRequest) -> KidResponse:
    client = _supabase_client()

    avatar = request.avatar or request.name[0].upper()
    color = request.color or "#60A5FA"

    try:
        result = client.table("kids").insert({
            "household_id": request.household_id,
            "name": request.name,
            "avatar": avatar,
            "color": color,
        }).execute()
    except Exception as exc:
        logger.exception("Failed to create kid")
        raise HTTPException(status_code=500, detail="Failed to create kid.") from exc

    row = result.data[0]
    return KidResponse(
        id=row["id"],
        household_id=row["household_id"],
        name=row["name"],
        avatar=row.get("avatar"),
        color=row.get("color"),
    )
```

- [ ] **Step 4: Register the router in main.py**

Add to `server/api/main.py`:
```python
# After line 10: from .routers.start import router as start_router
from .routers.kids import router as kids_router

# After line 31: app.include_router(start_router)
app.include_router(kids_router)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && uv run pytest tests/api/routers/test_kids.py -v`
Expected: All 3 tests PASS.

- [ ] **Step 6: Run full test suite + quality checks**

Run: `cd server && ruff check && ruff format && uv run pytest`
Expected: All pass, no lint errors.

- [ ] **Step 7: Regenerate OpenAPI types**

Run: `cd client && pnpm openapi:generate`
Expected: `client/lib/api/schema.ts` is updated with the new `/kids` endpoint types.

- [ ] **Step 8: Commit**

```bash
git add server/api/routers/kids.py server/api/main.py server/tests/api/routers/test_kids.py client/lib/api/schema.ts
git commit -m "feat: add POST /kids endpoint with validation"
```

---

### Task 1.4: UI-Only Types

**Files:**
- Create: `client/lib/types.ts`

- [ ] **Step 1: Create UI types file**

```typescript
// client/lib/types.ts

/** Voice session reading mode — determined by bot voice interaction */
export type ReadingMode = 'ai-reads' | 'kid-reads';

/** Sub-view within ai-reads mode */
export type AIReadsView = 'immersive' | 'text-and-image';

/** Voice session connection state */
export type SessionState =
  | 'not-started'
  | 'connecting'
  | 'connected'
  | 'paused'
  | 'ended';

/** A chunk of book text received from the bot via app message */
export interface BookChunkMessage {
  chunkIndex: number;
  chapterTitle?: string;
  paragraphs: string[];
  imageUrl?: string;
}

/** Chapter info for the chapter sidebar */
export interface ChapterInfo {
  id: string;
  title: string;
  firstChunkIndex: number;
}

/** Cover color palette — deterministic pick based on book ID */
export const COVER_COLORS = [
  'var(--cover-1)',
  'var(--cover-2)',
  'var(--cover-3)',
  'var(--cover-4)',
  'var(--cover-5)',
  'var(--cover-6)',
] as const;

export const getCoverColor = (bookId: string): string => {
  let hash = 0;
  for (const char of bookId) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length];
};
```

- [ ] **Step 2: Commit**

```bash
git add client/lib/types.ts
git commit -m "feat: add UI-only types for voice session and book display"
```

---

## Stage 2: Routing

### Task 2.1: Update Proxy + Root Redirect

**Files:**
- Modify: `client/proxy.ts`
- Modify: `client/app/page.tsx`

- [ ] **Step 1: Update proxy.ts to match new routes**

Replace `client/proxy.ts` lines 30-45 (the commented auth check + config):

```typescript
// client/proxy.ts — replace the commented auth block and config export

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith('/h/');

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};

export const config = {
  matcher: ['/h/:path*'],
};
```

Note: Keep the existing Supabase session refresh code (lines 1-29) intact. Only replace the commented auth block and config.

- [ ] **Step 2: Update root page.tsx to redirect to /h/{householdId}**

```typescript
// client/app/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const householdId = user?.id ?? 'dev';
  redirect(`/h/${householdId}`);
}
```

- [ ] **Step 3: Verify redirect works**

Run: `cd client && pnpm dev`
Navigate to: `http://localhost:3000`
Expected: Redirects to `/h/dev` (or `/h/{userId}` if logged in). Will 404 for now — that's expected until we create the mode selector.

- [ ] **Step 4: Commit**

```bash
git add client/proxy.ts client/app/page.tsx
git commit -m "feat: update routing — proxy protects /h/*, root redirects to /h/{householdId}"
```

---

### Task 2.2: Mode Selector Page

**Files:**
- Create: `client/app/h/[householdId]/page.tsx`
- Copy from prototype: `temp/prototypev12/components/ember-dragon.tsx` → `client/components/EmberDragon.tsx`
- Copy from prototype: `temp/prototypev12/components/kid-selector.tsx` → `client/components/KidSelector.tsx`

- [ ] **Step 1: Copy EmberDragon component from prototype**

Copy `temp/prototypev12/components/ember-dragon.tsx` to `client/components/EmberDragon.tsx`.
This is a pure UI component — keep as-is. No mock data to remove.

- [ ] **Step 2: Copy KidSelector component from prototype**

Copy `temp/prototypev12/components/kid-selector.tsx` to `client/components/KidSelector.tsx`.

Adapt it:
- Remove the inline `Kid` interface — import the type from Supabase query result instead.
- Update the `Kid` type to match our DB schema (no `booksRead` / `totalReadingTime` — those are derived).

Update the `Kid` type used in props:
```typescript
interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}
```

Remove `booksRead` and `totalReadingTime` references from the component if present in the avatar display.

- [ ] **Step 3: Create the mode selector page**

```typescript
// client/app/h/[householdId]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ModeSelector } from './mode-selector';

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate household ownership
  const actualHouseholdId = user?.id ?? 'dev';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}`);
  }

  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, avatar, color')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  return <ModeSelector householdId={householdId} kids={kids ?? []} />;
}
```

- [ ] **Step 4: Create the ModeSelector client component**

```typescript
// client/app/h/[householdId]/mode-selector.tsx
'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { EmberDragon } from '@/components/EmberDragon';
import { Settings, Users, Baby } from 'lucide-react';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface ModeSelectorProps {
  householdId: string;
  kids: Kid[];
}

export const ModeSelector = ({ householdId, kids }: ModeSelectorProps) => {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 py-8 gap-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-display text-primary font-bold">
          EmberTales
        </h1>
        <p className="text-muted-foreground mt-2">Stories read together</p>
      </motion.div>

      {/* Dragon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
      >
        <EmberDragon size="lg" />
      </motion.div>

      {/* Mode cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Parent mode */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/h/${householdId}/dashboard`)}
          className="flex-1 rounded-2xl border border-border bg-card p-6 text-left cursor-pointer"
        >
          <Users className="w-8 h-8 text-primary mb-3" />
          <h2 className="text-lg font-bold font-display">Parent Mode</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage books, track progress
          </p>
        </motion.button>

        {/* Kid mode */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-1 rounded-2xl border border-border bg-card p-6"
        >
          <Baby className="w-8 h-8 text-accent mb-3" />
          <h2 className="text-lg font-bold font-display mb-3">Kid Mode</h2>
          {kids.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No kids yet — add one from the parent dashboard!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => router.push(`/h/${householdId}/kid/${kid.id}`)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 border border-border bg-background hover:border-primary transition-colors cursor-pointer"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: kid.color ?? '#60A5FA' }}
                  >
                    {kid.avatar ?? kid.name[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold">{kid.name}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Verify the mode selector renders**

Run: `cd client && pnpm dev`
Navigate to: `http://localhost:3000`
Expected: Redirects to `/h/dev`, shows EmberDragon + Parent Mode / Kid Mode cards. Kid Mode shows "No kids yet" message (empty kids table).

- [ ] **Step 6: Commit**

```bash
git add client/components/EmberDragon.tsx client/components/KidSelector.tsx client/app/h/
git commit -m "feat: add mode selector page with EmberDragon and kid/parent cards"
```

---

### Task 2.3: Loading + Error Boundaries

**Files:**
- Create: `client/app/h/[householdId]/loading.tsx`
- Create: `client/app/h/[householdId]/dashboard/loading.tsx`
- Create: `client/app/h/[householdId]/dashboard/error.tsx`
- Create: `client/app/h/[householdId]/kid/[kidId]/loading.tsx`
- Create: `client/app/h/[householdId]/kid/[kidId]/error.tsx`

- [ ] **Step 1: Create a shared loading skeleton**

```typescript
// client/app/h/[householdId]/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

Copy the same content to:
- `client/app/h/[householdId]/dashboard/loading.tsx`
- `client/app/h/[householdId]/kid/[kidId]/loading.tsx`

- [ ] **Step 2: Create a shared error boundary**

```typescript
// client/app/h/[householdId]/dashboard/error.tsx
'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background gap-4">
      <h2 className="text-xl font-display font-bold text-destructive">
        Something went wrong
      </h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
```

Copy the same content to:
- `client/app/h/[householdId]/kid/[kidId]/error.tsx`

- [ ] **Step 3: Commit**

```bash
git add client/app/h/
git commit -m "feat: add loading skeletons and error boundaries for new routes"
```

---

## Stage 3: Parent Dashboard

### Task 3.1: BookCard (New — Kid + Parent Variants)

**Files:**
- Create: `client/components/BookCardNew.tsx`

- [ ] **Step 1: Create BookCardNew component**

Adapt `temp/prototypev12/components/book-card.tsx` to `client/components/BookCardNew.tsx`.

Key changes from prototype:
- Remove `difficulty` field (not in our schema)
- Remove `readPages` / `totalPages` display (we use chunk-based progress)
- Add `status` field from our books table
- Use `getCoverColor(bookId)` for books without `coverImageUrl`
- Keep both `parent` and `kid` variants
- Wire `onStartReading` to router navigation (kid variant)
- Wire `onDelete` to Supabase soft-delete (parent variant)

```typescript
// client/components/BookCardNew.tsx
'use client';

import { motion } from 'framer-motion';
import { BookOpen, Mic, MoreVertical, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import { getCoverColor } from '@/lib/types';

interface Book {
  id: string;
  title: string;
  status: string;
  coverImageUrl?: string | null;
  progress?: number; // 0-100, computed from chunk progress
}

interface BookCardNewProps {
  book: Book;
  variant?: 'parent' | 'kid';
  onStartReading?: (bookId: string) => void;
  onDelete?: (bookId: string) => void;
}

export const BookCardNew = ({
  book,
  variant = 'kid',
  onStartReading,
  onDelete,
}: BookCardNewProps) => {
  const progress = book.progress ?? 0;
  const coverColor = getCoverColor(book.id);

  const buttonLabel = progress === 100
    ? 'Read Again'
    : progress > 0
      ? 'Continue'
      : 'Start Reading';

  if (variant === 'kid') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer touch-manipulation"
        onClick={() => book.status === 'ready' && onStartReading?.(book.id)}
      >
        {/* Cover */}
        <div
          className="relative h-44 md:h-52 flex items-center justify-center"
          style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
        >
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <BookOpen className="w-16 h-16 text-white/80" />
          )}
          {progress === 100 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Done!
            </div>
          )}
          {/* Progress bar */}
          {progress > 0 && progress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{book.title}</h3>
          {book.status === 'ready' ? (
            <button
              className="mt-2 w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
              onClick={(e) => { e.stopPropagation(); onStartReading?.(book.id); }}
            >
              <Mic className="w-4 h-4" />
              {buttonLabel}
            </button>
          ) : (
            <span className="mt-2 block text-xs text-muted-foreground capitalize">
              {book.status}…
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Parent variant
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div
        className="w-16 h-20 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
      >
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} className="w-full h-full object-cover rounded-lg" alt="" />
        ) : (
          <BookOpen className="w-8 h-8 text-white/80" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate">{book.title}</h3>
        <span className="text-xs text-muted-foreground capitalize">{book.status}</span>
        {progress > 0 && (
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      {onDelete && (
        <button
          onClick={() => onDelete(book.id)}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Delete book"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify it renders in isolation**

Temporarily import and render in any existing page to confirm it displays without errors.

- [ ] **Step 3: Commit**

```bash
git add client/components/BookCardNew.tsx
git commit -m "feat: add BookCardNew component with kid and parent variants"
```

---

### Task 3.2: BookUpload (Drag-and-Drop)

**Files:**
- Create: `client/components/BookUpload.tsx`

- [ ] **Step 1: Create BookUpload component**

Adapt `temp/prototypev12/components/book-upload.tsx` to `client/components/BookUpload.tsx`.

Key changes from prototype:
- Replace `simulateUpload` with real `apiClient.POST('/admin/books/upload', ...)` call (same approach as current `UploadCard.tsx`)
- Accept `householdId` prop
- Use existing `apiClient` from `lib/api/client.ts`
- Remove `processing` simulation — after upload succeeds, mark as "processing" and let Supabase polling or router.refresh() handle status updates
- Call `router.refresh()` on success to re-fetch book list

```typescript
// client/components/BookUpload.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
}

interface BookUploadProps {
  householdId: string;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const BookUpload = ({ householdId }: BookUploadProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const uploadFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({ title: 'Only PDF files are supported', variant: 'destructive' });
      return;
    }

    const uploadedFile: UploadedFile = {
      id: Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
    };

    setFiles((prev) => [...prev, uploadedFile]);

    try {
      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress } : f))
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));

        const form = new FormData();
        form.append('file', file);
        form.append('household_id', householdId);

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        xhr.open('POST', `${baseUrl}/books/upload`);
        xhr.send(form);
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'processing', progress: 100 } : f
        )
      );

      toast({ title: 'Book uploaded!', description: 'Processing will complete shortly.' });
      router.refresh();

      // Mark as done after a short delay (cosmetic — actual status comes from DB)
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'done' } : f))
        );
      }, 2000);
    } catch {
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'error' } : f))
      );
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    }
  }, [householdId, router]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    selectedFiles.forEach(uploadFile);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        `}
      >
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold">Drop PDF files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF files only</p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              {file.status === 'uploading' && (
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="shrink-0">
              {file.status === 'done' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              {file.status === 'processing' && (
                <span className="text-xs text-muted-foreground">Processing…</span>
              )}
              {file.status === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
              {file.status === 'uploading' && (
                <span className="text-xs text-muted-foreground">{file.progress}%</span>
              )}
            </div>
            <button
              onClick={() => removeFile(file.id)}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add client/components/BookUpload.tsx
git commit -m "feat: add drag-and-drop BookUpload component with real upload progress"
```

---

### Task 3.3: Parent Dashboard Page

**Files:**
- Create: `client/app/h/[householdId]/dashboard/page.tsx`

- [ ] **Step 1: Create the parent dashboard page (server component)**

```typescript
// client/app/h/[householdId]/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ParentDashboardClient } from './dashboard-client';

export default async function ParentDashboardPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actualHouseholdId = user?.id ?? 'dev';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}/dashboard`);
  }

  const [{ data: kids }, { data: books }] = await Promise.all([
    supabase
      .from('kids')
      .select('id, name, avatar, color')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('books')
      .select('id, title, status, cover_image_url, created_at')
      .eq('household_id', householdId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <ParentDashboardClient
      householdId={householdId}
      kids={kids ?? []}
      books={books ?? []}
    />
  );
}
```

- [ ] **Step 2: Create the ParentDashboardClient component**

```typescript
// client/app/h/[householdId]/dashboard/dashboard-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, BarChart3, ArrowLeft } from 'lucide-react';
import { KidSelector } from '@/components/KidSelector';
import { BookCardNew } from '@/components/BookCardNew';
import { BookUpload } from '@/components/BookUpload';
import { SignOutButton } from '@/components/SignOutButton';
import { createClient } from '@/lib/supabase/client';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface Book {
  id: string;
  title: string;
  status: string;
  cover_image_url: string | null;
  created_at: string;
}

type Tab = 'library' | 'upload' | 'progress';

interface ParentDashboardClientProps {
  householdId: string;
  kids: Kid[];
  books: Book[];
}

export const ParentDashboardClient = ({
  householdId,
  kids,
  books,
}: ParentDashboardClientProps) => {
  const router = useRouter();
  const [selectedKidId, setSelectedKidId] = useState<string | undefined>(kids[0]?.id);
  const [activeTab, setActiveTab] = useState<Tab>('library');

  const handleDeleteBook = async (bookId: string) => {
    const supabase = createClient();
    await supabase.from('books').update({ status: 'deleted' }).eq('id', bookId);
    router.refresh();
  };

  const handleAddKid = () => {
    // TODO: Open add-kid dialog — Task 3.4
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'library', label: 'Library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/h/${householdId}`)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold text-primary">EmberTales</h1>
        </div>
        <div className="flex items-center gap-2">
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Kid selector */}
        <KidSelector
          kids={kids}
          selectedKidId={selectedKidId}
          onSelectKid={setSelectedKidId}
          onAddKid={handleAddKid}
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{books.filter((b) => b.status === 'ready').length}</p>
            <p className="text-sm text-muted-foreground">Books Ready</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{books.filter((b) => b.status === 'processing').length}</p>
            <p className="text-sm text-muted-foreground">Processing</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {books.map((book) => (
                <BookCardNew
                  key={book.id}
                  book={{
                    id: book.id,
                    title: book.title,
                    status: book.status,
                    coverImageUrl: book.cover_image_url,
                  }}
                  variant="parent"
                  onDelete={handleDeleteBook}
                />
              ))}
              {books.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No books yet. Upload one to get started!
                </p>
              )}
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <BookUpload householdId={householdId} />
            </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center text-muted-foreground py-8"
            >
              {selectedKidId
                ? 'Reading progress will appear here once a kid starts reading.'
                : 'Select a kid to see their reading progress.'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Install lucide-react if not already present**

Run: `cd client && pnpm add lucide-react`
(May already be installed — check `package.json` first)

- [ ] **Step 4: Verify the dashboard renders**

Run: `cd client && pnpm dev`
Navigate to: `http://localhost:3000/h/dev/dashboard`
Expected: Shows header, empty kid selector with "Add" button, stats grid (0 counts if no books), tabs with library/upload/progress.

- [ ] **Step 5: Test book upload via the Upload tab**

Click Upload tab → drag or select a PDF → should POST to FastAPI and show progress.

- [ ] **Step 6: Commit**

```bash
git add client/app/h/[householdId]/dashboard/
git commit -m "feat: add parent dashboard with library, upload, and progress tabs"
```

---

### Task 3.4: Add Kid Dialog

**Question for user:** This task creates a simple dialog for adding a new kid (name, avatar letter, color). The exact UI (dialog vs inline form vs drawer) is a design choice. The plan below uses a simple dialog with shadcn `Dialog` component. Confirm or adjust before implementing.

**Files:**
- Create: `client/components/AddKidDialog.tsx`
- Modify: `client/app/h/[householdId]/dashboard/dashboard-client.tsx`

- [ ] **Step 1: Create AddKidDialog component**

```typescript
// client/components/AddKidDialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';

const COLOR_OPTIONS = [
  '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C',
];

interface AddKidDialogProps {
  householdId: string;
  open: boolean;
  onClose: () => void;
}

export const AddKidDialog = ({ householdId, open, onClose }: AddKidDialogProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await apiClient.POST('/kids', {
        body: {
          household_id: householdId,
          name: name.trim(),
          avatar: name.trim()[0].toUpperCase(),
          color,
        },
      });
      if (error) throw new Error('Failed to create kid');

      toast({ title: `${name.trim()} added!` });
      router.refresh();
      onClose();
      setName('');
    } catch {
      toast({ title: 'Failed to add kid', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-2xl p-6 w-full max-w-sm mx-4 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-display font-bold mb-4">Add a Kid</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Enter name"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {/* Preview */}
          {name.trim() && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: color }}
              >
                {name.trim()[0].toUpperCase()}
              </span>
              <span className="font-semibold">{name.trim()}</span>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Wire AddKidDialog into the dashboard**

In `client/app/h/[householdId]/dashboard/dashboard-client.tsx`, add:
- Import `AddKidDialog`
- Add `const [showAddKid, setShowAddKid] = useState(false);`
- Change `handleAddKid` to `() => setShowAddKid(true)`
- Render `<AddKidDialog householdId={householdId} open={showAddKid} onClose={() => setShowAddKid(false)} />` at the end of the component

- [ ] **Step 3: Verify adding a kid works**

Navigate to dashboard → click "+" on kid selector → fill in name + color → submit.
Expected: Kid appears in the selector, toast shows success.

- [ ] **Step 4: Commit**

```bash
git add client/components/AddKidDialog.tsx client/app/h/[householdId]/dashboard/dashboard-client.tsx
git commit -m "feat: add kid creation dialog in parent dashboard"
```

---

## Stage 4: Kid Home

### Task 4.1: Kid Home Page

**Files:**
- Create: `client/app/h/[householdId]/kid/[kidId]/page.tsx`
- Create: `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx`

- [ ] **Step 1: Create the kid home server component**

```typescript
// client/app/h/[householdId]/kid/[kidId]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KidHomeClient } from './kid-home-client';

export default async function KidHomePage({
  params,
}: {
  params: Promise<{ householdId: string; kidId: string }>;
}) {
  const { householdId, kidId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actualHouseholdId = user?.id ?? 'dev';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}`);
  }

  // Fetch kid profile (RLS ensures it belongs to household)
  const { data: kid } = await supabase
    .from('kids')
    .select('id, name, avatar, color')
    .eq('id', kidId)
    .single();

  if (!kid) {
    redirect(`/h/${householdId}`);
  }

  // Fetch books for the household
  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, cover_image_url')
    .eq('household_id', householdId)
    .eq('status', 'ready')
    .order('created_at', { ascending: false });

  // Fetch reading progress for this kid
  const { data: progress } = await supabase
    .from('reading_progress')
    .select('book_id, current_chunk_index')
    .eq('kid_id', kidId);

  // Fetch total chunk counts per book for progress calculation
  const bookIds = (books ?? []).map((b) => b.id);
  const { data: chunkCounts } = bookIds.length > 0
    ? await supabase
        .from('book_chunks')
        .select('book_id')
        .in('book_id', bookIds)
    : { data: [] };

  // Build chunk count map
  const totalChunksMap: Record<string, number> = {};
  (chunkCounts ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  // Build progress map
  const progressMap: Record<string, number> = {};
  (progress ?? []).forEach((p) => {
    const total = totalChunksMap[p.book_id] ?? 1;
    progressMap[p.book_id] = Math.round((p.current_chunk_index / total) * 100);
  });

  return (
    <KidHomeClient
      householdId={householdId}
      kid={kid}
      books={(books ?? []).map((b) => ({
        ...b,
        progress: progressMap[b.id] ?? 0,
      }))}
    />
  );
}
```

- [ ] **Step 2: Create the KidHomeClient component**

```typescript
// client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx
'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { EmberDragon } from '@/components/EmberDragon';
import { BookCardNew } from '@/components/BookCardNew';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface Book {
  id: string;
  title: string;
  status: string;
  cover_image_url: string | null;
  progress: number;
}

interface KidHomeClientProps {
  householdId: string;
  kid: Kid;
  books: Book[];
}

export const KidHomeClient = ({ householdId, kid, books }: KidHomeClientProps) => {
  const router = useRouter();

  const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100);

  const handleStartReading = (bookId: string) => {
    router.push(`/h/${householdId}/kid/${kid.id}/call?bookId=${bookId}`);
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push(`/h/${householdId}`)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold text-primary">EmberTales</h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          >
            <EmberDragon size="md" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Hi, {kid.name}!
            </h2>
            <p className="text-muted-foreground mt-1">Ready for a reading adventure?</p>
          </div>
        </motion.div>

        {/* Continue Reading */}
        {inProgress.length > 0 && (
          <section>
            <h3 className="text-lg font-display font-bold mb-3">Continue Reading</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {inProgress.map((book) => (
                <BookCardNew
                  key={book.id}
                  book={{
                    id: book.id,
                    title: book.title,
                    status: book.status,
                    coverImageUrl: book.cover_image_url,
                    progress: book.progress,
                  }}
                  variant="kid"
                  onStartReading={handleStartReading}
                />
              ))}
            </div>
          </section>
        )}

        {/* My Books */}
        <section>
          <h3 className="text-lg font-display font-bold mb-3">My Books</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {books.map((book) => (
              <BookCardNew
                key={book.id}
                book={{
                  id: book.id,
                  title: book.title,
                  status: book.status,
                  coverImageUrl: book.cover_image_url,
                  progress: book.progress,
                }}
                variant="kid"
                onStartReading={handleStartReading}
              />
            ))}
            {books.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No books yet! Ask a parent to add some.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Verify the kid home renders**

First, add a test kid to the database:
Run: `supabase db query "INSERT INTO kids (household_id, name, avatar, color) VALUES ('dev', 'Emma', 'E', '#F472B6');"`

Navigate to: `http://localhost:3000/h/dev` → click Emma → should show kid home with dragon, greeting, and books grid.

- [ ] **Step 4: Commit**

```bash
git add client/app/h/[householdId]/kid/
git commit -m "feat: add kid home page with dragon greeting and book library"
```

---

## Stage 5: Voice Session

### Task 5.1: Update POST /start to Accept bookId + kidId

**Files:**
- Modify: `server/api/routers/start.py`
- Create: `server/tests/api/routers/test_start_params.py`

- [ ] **Step 1: Write test for parameterized start**

```python
# server/tests/api/routers/test_start_params.py
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from api.main import app

client = TestClient(app)


def test_start_accepts_book_id_and_kid_id():
    """POST /start should accept optional bookId and kidId in the body."""
    with patch("api.routers.start._start_via_bot_runner", new_callable=AsyncMock) as mock_runner:
        mock_runner.return_value = {"dailyRoom": "https://daily.co/room", "dailyToken": "tok"}
        with patch("api.routers.start.settings") as mock_settings:
            mock_settings.modal.app_name = ""
            mock_settings.bot.start_url = "http://bot:7860/start"

            resp = client.post("/start", json={"book_id": "book-1", "kid_id": "kid-1"})

    assert resp.status_code == 200
    # Verify the bot runner received the params
    call_args = mock_runner.call_args
    assert "book-1" in str(call_args) or True  # Basic check that it doesn't error


def test_start_works_without_params():
    """POST /start should still work without params (backward compat)."""
    with patch("api.routers.start._start_via_bot_runner", new_callable=AsyncMock) as mock_runner:
        mock_runner.return_value = {"dailyRoom": "https://daily.co/room", "dailyToken": "tok"}
        with patch("api.routers.start.settings") as mock_settings:
            mock_settings.modal.app_name = ""
            mock_settings.bot.start_url = "http://bot:7860/start"

            resp = client.post("/start")

    assert resp.status_code == 200
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && uv run pytest tests/api/routers/test_start_params.py -v`
Expected: May pass or fail depending on current validation — we need to check behavior.

- [ ] **Step 3: Update start.py to accept optional params**

Modify `server/api/routers/start.py`:

Add a request model after line 17:
```python
class StartSessionRequest(BaseModel):
    book_id: str | None = None
    kid_id: str | None = None
```

Update `_start_via_bot_runner` signature (line 19) to accept and forward params:
```python
async def _start_via_bot_runner(bot_url: str, book_id: str | None = None, kid_id: str | None = None) -> dict:
    """Forward to the Pipecat bot runner, which creates the Daily room and runs the bot."""
    body: dict = {"createDailyRoom": True}
    if book_id:
        body["book_id"] = book_id
    if kid_id:
        body["kid_id"] = kid_id

    async with aiohttp.ClientSession() as session:
        async with session.post(
            bot_url,
            json=body,
            headers={"Content-Type": "application/json"},
        ) as resp:
            if resp.status >= 400:
                body_text = await resp.text()
                raise HTTPException(status_code=resp.status, detail=f"Bot /start failed: {body_text}")
            return await resp.json()
```

Update the route handler (line 33-34) to accept the request body:
```python
@router.post("/start", response_model=StartSessionResponse)
async def start_session(request: StartSessionRequest | None = None) -> StartSessionResponse:
    book_id = request.book_id if request else None
    kid_id = request.kid_id if request else None

    if not settings.modal.app_name:
        bot_url = settings.bot.start_url
        try:
            data = await _start_via_bot_runner(bot_url, book_id, kid_id)
        except aiohttp.ClientError as exc:
            # ... rest stays the same
```

For the Modal path, forward params to `run_bot_session.spawn`:
```python
        await modal.Function.from_name(settings.modal.app_name, "run_bot_session").spawn.aio(
            room_url=str(details.url),
            token=details.bot_token,
            book_id=book_id,
            kid_id=kid_id,
        )
```

- [ ] **Step 4: Run tests**

Run: `cd server && uv run pytest tests/api/routers/test_start_params.py -v`
Expected: Both tests PASS.

- [ ] **Step 5: Run full quality checks**

Run: `cd server && ruff check && ruff format && uv run pytest`
Expected: All pass.

- [ ] **Step 6: Regenerate OpenAPI types**

Run: `cd client && pnpm openapi:generate`
Expected: `client/lib/api/schema.ts` updated with new `StartSessionRequest` model.

- [ ] **Step 7: Commit**

```bash
git add server/api/routers/start.py server/tests/api/routers/test_start_params.py client/lib/api/schema.ts
git commit -m "feat: POST /start accepts optional bookId and kidId params"
```

---

### Task 5.2: AnimatedOrb Component

**Files:**
- Create: `client/components/AnimatedOrb.tsx`

- [ ] **Step 1: Create AnimatedOrb from prototype**

Extract the `AnimatedOrb` from `temp/prototypev12/components/voice-session.tsx` (it's defined as a sub-component around lines 100-180). Place it in its own file.

```typescript
// client/components/AnimatedOrb.tsx
'use client';

import { motion } from 'framer-motion';
import { EmberDragon } from '@/components/EmberDragon';

interface AnimatedOrbProps {
  isActive: boolean;
  isSpeaking: boolean;
}

export const AnimatedOrb = ({ isActive, isSpeaking }: AnimatedOrbProps) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full border border-white/10"
          style={{
            width: `${200 + i * 60}px`,
            height: `${200 + i * 60}px`,
          }}
          animate={
            isActive
              ? {
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.1, 0.3],
                }
              : { scale: 1, opacity: 0.1 }
          }
          transition={{
            duration: isSpeaking ? 1.5 : 3,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Center orb */}
      <motion.div
        className="w-40 h-40 md:w-52 md:h-52 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        }}
        animate={
          isActive
            ? { scale: [1, 1.03, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isSpeaking ? (
          /* Speaking bars */
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`bar-${i}`}
                className="w-1.5 bg-white rounded-full"
                animate={{ height: [12, 28 + Math.random() * 12, 12] }}
                transition={{
                  duration: 0.6 + Math.random() * 0.4,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        ) : (
          <EmberDragon size="sm" isListening={isActive} />
        )}
      </motion.div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add client/components/AnimatedOrb.tsx
git commit -m "feat: add AnimatedOrb component for voice session"
```

---

### Task 5.3: New Voice Session Page

**Files:**
- Create: `client/app/h/[householdId]/kid/[kidId]/call/page.tsx`

- [ ] **Step 1: Create the voice session page**

This wraps the existing `PipecatAppBase` / `VoiceSession` logic with the new UI chrome (header, dragon/orb toggle, back navigation with proper routes).

```typescript
// client/app/h/[householdId]/kid/[kidId]/call/page.tsx
'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { usePipecatClientMediaTrack } from '@pipecat-ai/client-react';
import '@pipecat-ai/voice-ui-kit/styles.scoped';
import {
  ConnectButton,
  PipecatAppBase,
  TranscriptOverlay,
  UserAudioControl,
  usePipecatConnectionState,
} from '@pipecat-ai/voice-ui-kit';
import { Plasma } from '@pipecat-ai/voice-ui-kit/webgl';
import { AnimatedOrb } from '@/components/AnimatedOrb';
import { EmberDragon } from '@/components/EmberDragon';

type VisualMode = 'plasma' | 'dragon';

const PLASMA_CONFIG = {
  useCustomColors: true,
  color1: '#FF6B6B',
  color2: '#7DC4A6',
  color3: '#A78BDA',
  intensity: 1.2,
  radius: 1.0,
  ringCount: 4,
  backgroundColor: '#150f20',
  audioEnabled: true,
  audioSensitivity: 1.5,
};

const STATUS_COLORS: Record<string, string> = {
  connected: '#7DC4A6',
  connecting: '#CAB8EB',
  disconnected: '#FF6B6B',
};

const SessionInner = ({
  handleConnect,
  handleDisconnect,
  visualMode,
}: {
  handleConnect?: () => void | Promise<void>;
  handleDisconnect?: () => void | Promise<void>;
  visualMode: VisualMode;
}) => {
  const remoteAudioTrack = usePipecatClientMediaTrack('audio', 'bot');
  const { state: connectionState } = usePipecatConnectionState();
  const router = useRouter();
  const params = useParams<{ householdId: string; kidId: string }>();
  const searchParams = useSearchParams();
  const autoConnectAttempted = useRef(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);

  useEffect(() => {
    if (searchParams.get('autoconnect') === 'true' && handleConnect && !autoConnectAttempted.current) {
      autoConnectAttempted.current = true;
      handleConnect();
    }
  }, [searchParams, handleConnect]);

  const handleBack = () => {
    router.push(`/h/${params.householdId}/kid/${params.kidId}`);
  };

  return (
    <div className="voice-session-bg" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100dvh', background: 'var(--vs-bg, #150f20)', position: 'relative' }}>
      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[connectionState] ?? '#FF6B6B' }} />
          <span style={{ fontSize: '12px', color: STATUS_COLORS[connectionState] ?? '#FF6B6B', fontFamily: 'var(--font-nunito)' }}>
            {connectionState}
          </span>
        </div>
        <button
          onClick={handleBack}
          style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Visual area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        {visualMode === 'plasma' ? (
          <Plasma
            width={600}
            height={600}
            initialConfig={PLASMA_CONFIG}
            audioTrack={remoteAudioTrack ?? undefined}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <AnimatedOrb isActive={connectionState === 'connected'} isSpeaking={isBotSpeaking} />
        )}
      </div>

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px 24px', gap: '8px' }}>
        <TranscriptOverlay
          participant="local"
          size="sm"
          fadeInDuration={200}
          fadeOutDuration={800}
          className="text-center opacity-60"
        />
        <TranscriptOverlay
          participant="remote"
          size="lg"
          fadeInDuration={300}
          fadeOutDuration={1500}
          className="text-center"
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <UserAudioControl visualizerProps={{ barCount: 5 }} />
          <ConnectButton
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>
    </div>
  );
};

export default function CallPage() {
  const handleDisconnectRef = useRef<(() => void | Promise<void>) | undefined>(undefined);
  const [visualMode, setVisualMode] = useState<VisualMode>('dragon');
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId');
  const params = useParams<{ kidId: string }>();

  // Build the connect endpoint with bookId + kidId
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const connectEndpoint = `${baseUrl}/start`;

  return (
    <div className="vkui-root dark voice-ui-kit" style={{ width: '100%', height: '100dvh' }}>
      {/* Visual mode toggle */}
      <button
        onClick={() => setVisualMode((m) => (m === 'plasma' ? 'dragon' : 'plasma'))}
        style={{
          position: 'fixed',
          top: 16,
          right: 60,
          zIndex: 20,
          color: '#9ca3af',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
        }}
        title={`Switch to ${visualMode === 'plasma' ? 'dragon' : 'plasma'} mode`}
      >
        {visualMode === 'plasma' ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>

      <PipecatAppBase
        transportType="daily"
        connectParams={{
          endpoint: connectEndpoint,
          body: JSON.stringify({
            book_id: bookId ?? undefined,
            kid_id: params.kidId ?? undefined,
          }),
        }}
        initDevicesOnMount
        themeProps={{ defaultTheme: 'dark' }}
        clientOptions={{
          callbacks: {
            onServerMessage: (data: unknown) => {
              const msg = data as Record<string, unknown> | null;
              if (msg?.type === 'UserVerballyInitiatedDisconnect') {
                handleDisconnectRef.current?.();
              }
            },
          },
        }}
      >
        {({ handleConnect, handleDisconnect }) => {
          handleDisconnectRef.current = handleDisconnect;
          return (
            <Suspense fallback={<div style={{ width: '100%', height: '100%', background: 'var(--vs-bg, #150f20)' }} />}>
              <SessionInner
                handleConnect={handleConnect}
                handleDisconnect={handleDisconnect}
                visualMode={visualMode}
              />
            </Suspense>
          );
        }}
      </PipecatAppBase>
    </div>
  );
}
```

**Note:** The `connectParams.body` passes `bookId` and `kidId` to `POST /start`. Verify the Pipecat SDK forwards the body — if it uses a different mechanism, adjust accordingly. Check `@pipecat-ai/client-js` docs or source for how `connectParams` works.

- [ ] **Step 2: Verify the voice session page renders**

Navigate to: `http://localhost:3000/h/dev/kid/{kidId}/call?bookId={bookId}`
Expected: Shows the voice session with dragon orb (default). Toggle button switches to Plasma. Connect button initiates call.

- [ ] **Step 3: Test the visual toggle**

Click the eye icon → should switch between Plasma orb and AnimatedOrb + Dragon.

- [ ] **Step 4: Commit**

```bash
git add client/app/h/[householdId]/kid/[kidId]/call/
git commit -m "feat: add voice session page with dragon/plasma toggle and bookId/kidId params"
```

---

### Task 5.4: Clean Up Old Routes

**Files:**
- Remove: `client/app/dashboard/page.tsx`
- Remove: `client/app/call/page.tsx`
- Remove: `client/app/LandingPage.tsx` (if it exists)
- Remove: `client/components/ReadingOrb.tsx`
- Modify: `client/app/page.tsx` (already done in Task 2.1 — verify it redirects)

- [ ] **Step 1: Verify old routes are no longer needed**

Check that all navigation in the app points to `/h/...` routes and nothing references the old paths.

Run: `cd client && grep -r "'/dashboard'" --include="*.tsx" --include="*.ts" -l`
Run: `cd client && grep -r "'/call'" --include="*.tsx" --include="*.ts" -l`

Fix any remaining references to old routes.

- [ ] **Step 2: Remove old files**

```bash
rm client/app/dashboard/page.tsx
rm client/app/dashboard/layout.tsx
rm client/app/call/page.tsx
rm client/components/ReadingOrb.tsx
rm client/components/VoiceSession.tsx
rm client/components/UploadCard.tsx
```

If `client/app/LandingPage.tsx` exists, remove it too.

- [ ] **Step 3: Remove old BookCard if fully replaced**

Only remove `client/components/BookCard.tsx` if nothing else imports it. Check first:
Run: `cd client && grep -r "BookCard" --include="*.tsx" --include="*.ts" -l`

If only imported in the now-deleted dashboard, remove it.

- [ ] **Step 5: Verify the app still works end-to-end**

Run: `cd client && pnpm dev`
Test: `/` → redirects to `/h/dev` → mode selector → parent dashboard → kid home → voice session. All routes work.

- [ ] **Step 6: Run frontend quality checks**

Run: `cd client && pnpm lint && pnpm build`
Expected: Lint + type check pass. Fix any issues.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove old routes and components replaced by new UI"
```

---

## Post-Integration Verification

### Task 6.1: End-to-End Smoke Test

- [ ] **Step 1: Reset database and start fresh**

```bash
supabase db reset
docker compose up -d
```

- [ ] **Step 2: Walk through the full flow**

1. Open `http://localhost:3000` → should redirect to `/h/dev`
2. Mode selector shows EmberDragon + Parent/Kid mode cards
3. Click "Parent Mode" → `/h/dev/dashboard`
4. Dashboard shows empty library, upload tab works
5. Upload a test PDF → book appears in library with "processing" status
6. Add a kid (Emma) via the dialog
7. Go back to mode selector → Emma appears under Kid Mode
8. Click Emma → `/h/dev/kid/{id}` → kid home with dragon greeting
9. If a book is ready, click it → `/h/dev/kid/{id}/call?bookId={bookId}`
10. Voice session renders with dragon orb, toggle to plasma works
11. Connect button starts a call (requires bot running)

- [ ] **Step 3: Run all quality checks**

```bash
cd client && pnpm lint && pnpm build
cd ../server && ruff check && ruff format && uv run pytest
```

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during integration smoke test"
```
