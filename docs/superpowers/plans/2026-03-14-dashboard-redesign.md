# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dashboard as a two-panel layout (orb hero + library grid) with snap-scroll, consistent CSS variables, and auto-connect flow.

**Architecture:** Server Component page renders two panels — a `ReadingOrb` client component (Panel 1) and a library grid with `UploadCard`/`BookCard` client components (Panel 2). CSS media queries control snap-scroll behavior per viewport. Auto-connect is handled via query param on the `/call` page.

**Tech Stack:** Next.js 16 (App Router, React 19), Tailwind v4, Framer Motion, Pipecat voice-ui-kit WebGL, Supabase

**Spec:** `docs/superpowers/specs/2026-03-13-dashboard-redesign-design.md`

---

## Chunk 1: CSS Foundation + Simple Component Updates

### Task 1: Extend CSS Variables and Add Snap-Scroll Classes

**Files:**
- Modify: `client/app/globals.css`

- [ ] **Step 1: Update `.dashboard-dark` variables**

In `client/app/globals.css`, replace the existing `.dashboard-dark` block with the extended version. Keep all existing variables, update `--db-muted-fg` opacity, add new variables:

```css
.dashboard-dark {
  --db-bg: #150f20;
  --db-card: #1e1730;
  --db-fg: #d4c8ee;
  --db-primary: #CAB8EB;
  --db-muted: #2a2040;
  --db-muted-fg: rgba(202, 184, 235, 0.45);
  --db-border: rgba(167, 139, 218, 0.25);
  --db-accent: #A78BDA;
  --db-card-border: rgba(167, 139, 218, 0.1);
  --db-glow: rgba(167, 139, 218, 0.12);
  --db-border-dashed: rgba(167, 139, 218, 0.25);
  --db-status-ready: var(--sage);
  --db-status-processing: var(--amber);
  --db-status-error: var(--coral);
}
```

- [ ] **Step 2: Add snap-scroll and panel classes**

Append after the `.dashboard-dark` block (but before the `@layer base` block):

```css
/* Dashboard two-panel layout */
.dashboard-panels {
  min-height: 100dvh;
}

.dashboard-panel {
  display: flex;
  flex-direction: column;
}

.dashboard-panel--orb {
  align-items: center;
  justify-content: center;
  min-height: 40vh;
}

/* Orb responsive sizing: 120px on mobile/tablet, 100px on desktop */
.reading-orb {
  width: 120px;
  height: 120px;
}

@media (min-width: 1025px) {
  .reading-orb {
    width: 100px;
    height: 100px;
  }
}

/* Tablet landscape: horizontal snap scroll */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .dashboard-panels {
    display: flex;
    height: 100dvh;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }
  .dashboard-panel {
    min-width: 100vw;
    height: 100dvh;
    scroll-snap-align: start;
  }
  .dashboard-panel--library {
    overflow-y: auto;
  }
}

/* Mobile + tablet portrait: vertical snap scroll */
@media (max-width: 767px), (max-width: 1024px) and (orientation: portrait) {
  .dashboard-panels {
    height: 100dvh;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
  }
  .dashboard-panel {
    min-height: 100dvh;
    scroll-snap-align: start;
  }
  .dashboard-panel--library {
    overflow-y: auto;
    max-height: 100dvh;
  }
}
```

- [ ] **Step 3: Verify CSS parses correctly**

Run: `cd client && pnpm build 2>&1 | head -30`
Expected: No CSS parse errors. Build may fail on component changes (that's fine — we're only checking CSS here).

- [ ] **Step 4: Commit**

```bash
git add client/app/globals.css
git commit -m "feat: extend dashboard CSS variables and add snap-scroll classes"
```

---

### Task 2: Update SignOutButton to Use CSS Variables

**Files:**
- Modify: `client/components/SignOutButton.tsx`

- [ ] **Step 1: Replace hardcoded styles**

Replace the full content of `SignOutButton.tsx`:

```tsx
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
      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{
        color: 'var(--db-muted-fg)',
        fontFamily: 'var(--font-nunito)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-muted)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      Sign out
    </button>
  );
};
```

- [ ] **Step 2: Verify no hardcoded hex values remain**

Visually inspect the file — no `#` color values should appear.

- [ ] **Step 3: Commit**

```bash
git add client/components/SignOutButton.tsx
git commit -m "refactor: use CSS variables in SignOutButton"
```

---

### Task 3: Redesign BookCard with CSS Variables

**Files:**
- Modify: `client/components/BookCard.tsx`

- [ ] **Step 1: Rewrite BookCard**

Replace the full content of `BookCard.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';

interface BookCardProps {
  bookId: string;
  title: string;
  status: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ready: { color: 'var(--db-status-ready)', label: 'Ready' },
  processing: { color: 'var(--db-status-processing)', label: 'Processing' },
  error: { color: 'var(--db-status-error)', label: 'Error' },
};

export const BookCard = ({ title, status }: BookCardProps) => {
  const statusInfo = statusConfig[status] ?? statusConfig.processing;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        background: 'var(--db-card)',
        border: '1px solid var(--db-card-border)',
      }}
      whileHover={{
        scale: 1.03,
        y: -2,
        boxShadow: '0 4px 20px var(--db-glow)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Cover placeholder */}
      <div
        className="flex items-center justify-center"
        style={{
          height: 130,
          background: 'linear-gradient(145deg, var(--db-muted), var(--db-card))',
        }}
      >
        <span className="text-4xl opacity-40">📖</span>
      </div>

      {/* Text area */}
      <div className="p-3">
        <p
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: 'var(--db-fg)', fontFamily: 'var(--font-nunito)' }}
        >
          {title}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: statusInfo.color }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--db-muted-fg)' }}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
```

- [ ] **Step 2: Verify no hardcoded hex values remain**

Visually inspect — no `#` color values, no `accentColor` prop.

- [ ] **Step 3: Commit**

```bash
git add client/components/BookCard.tsx
git commit -m "refactor: redesign BookCard with CSS variables and cover placeholder"
```

---

### Task 4: Restyle UploadCard with CSS Variables

**Files:**
- Modify: `client/components/UploadCard.tsx`

- [ ] **Step 1: Rewrite UploadCard visual layer**

Replace the full content of `UploadCard.tsx`. Logic stays the same (drag-drop, file picker, upload via apiClient), only visuals change:

```tsx
'use client';

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Plus, SpinnerGap } from '@phosphor-icons/react';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';

export const UploadCard = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'Only PDF files are supported', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const { error } = await apiClient.POST('/admin/books/upload', {
        body: { file } as never,
        bodySerializer: () => {
          const form = new FormData();
          form.append('file', file);
          return form;
        },
      });

      if (error) throw new Error('Upload failed');

      toast({ title: 'Book uploaded!', description: 'Processing will complete shortly.', variant: 'success' as never });
    } catch {
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />
      <motion.button
        className="rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer select-none w-full"
        style={{
          border: '2px dashed var(--db-border-dashed)',
          background: 'rgba(30, 23, 48, 0.25)',
          opacity: uploading ? 0.6 : 1,
        }}
        whileHover={{
          boxShadow: '0 0 0 4px var(--db-glow)',
          background: 'rgba(30, 23, 48, 0.5)',
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        disabled={uploading}
        aria-label="Upload a PDF book"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
          style={{ background: 'var(--db-glow)' }}
        >
          {uploading ? (
            <SpinnerGap size={24} weight="bold" color="var(--db-accent)" className="animate-spin" />
          ) : (
            <Plus size={24} weight="bold" color="var(--db-accent)" />
          )}
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--db-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          {uploading ? 'Uploading…' : 'Upload PDF'}
        </span>
        {!uploading && (
          <span className="text-xs" style={{ color: 'var(--db-muted-fg)' }}>
            Drop file or click
          </span>
        )}
      </motion.button>
    </>
  );
};
```

- [ ] **Step 2: Verify no hardcoded hex values remain**

Visually inspect — the only rgba value is `rgba(30, 23, 48, ...)` for the translucent background (this is intentional as it's a semi-transparent overlay of `--db-card`, not a standalone color token).

- [ ] **Step 3: Commit**

```bash
git add client/components/UploadCard.tsx
git commit -m "refactor: restyle UploadCard with CSS variables and new layout"
```

---

## Chunk 2: ReadingOrb + Dashboard Page + Auto-Connect

### Task 5: Create ReadingOrb Component

**Files:**
- Create: `client/components/ReadingOrb.tsx`
- Delete: `client/components/MiniOrb.tsx`

- [ ] **Step 1: Create ReadingOrb.tsx**

This moves PlasmaOrb/PlasmaErrorBoundary from MiniOrb.tsx, changes layout to centered hero with label:

```tsx
'use client';

import { Component } from 'react';
import { Microphone } from '@phosphor-icons/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const PLASMA_CONFIG = {
  useCustomColors: true,
  color1: '#FF6B6B',
  color2: '#7DC4A6',
  color3: '#A78BDA',
  intensity: 1.2,
  radius: 1.0,
  ringCount: 4,
  backgroundColor: '#150f20',
  audioEnabled: false,
  audioSensitivity: 0,
};

class PlasmaErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const PlasmaOrb = dynamic(
  () =>
    import('@pipecat-ai/voice-ui-kit/webgl').then(({ Plasma }) => {
      const PlasmaWrapper = () => (
        <Plasma
          width={240}
          height={240}
          initialConfig={PLASMA_CONFIG}
          audioTrack={undefined}
          style={{ width: 120, height: 120 }}
        />
      );
      PlasmaWrapper.displayName = 'PlasmaWrapper';
      return PlasmaWrapper;
    }),
  { ssr: false },
);

const CSSGradientOrb = () => (
  <div
    className="rounded-full"
    style={{
      width: 120,
      height: 120,
      background: 'radial-gradient(circle at 35% 35%, var(--db-primary), var(--db-accent))',
    }}
  />
);

export const ReadingOrb = () => (
  <div className="flex flex-col items-center justify-center gap-4">
    {/* Glow backdrop */}
    <div className="relative">
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 200,
          height: 200,
          top: -40,
          left: -40,
          background: 'radial-gradient(circle, var(--db-glow), transparent 70%)',
        }}
      />
      <Link href="/call?autoconnect=true" aria-label="Start reading session">
        <div
          className="reading-orb relative rounded-full flex items-center justify-center cursor-pointer overflow-hidden transition-transform hover:scale-105"
          style={{ boxShadow: '0 8px 40px var(--db-glow)' }}
        >
          <PlasmaErrorBoundary fallback={<CSSGradientOrb />}>
            <PlasmaOrb />
          </PlasmaErrorBoundary>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Microphone weight="fill" size={28} color="#fff" />
          </div>
        </div>
      </Link>
    </div>

    {/* Labels */}
    <div className="text-center">
      <p
        className="text-base font-bold"
        style={{ color: 'var(--db-primary)', fontFamily: 'var(--font-nunito)' }}
      >
        Start Reading
      </p>
      <p
        className="text-xs mt-1"
        style={{ color: 'var(--db-muted-fg)' }}
      >
        Tap to talk with your reading buddy
      </p>
    </div>
  </div>
);
```

- [ ] **Step 2: Delete MiniOrb.tsx**

```bash
rm client/components/MiniOrb.tsx
```

- [ ] **Step 3: Verify no imports of MiniOrb remain (except page.tsx)**

Run: `cd client && grep -r "MiniOrb" --include="*.tsx" --include="*.ts" .`
Expected: Only `./app/dashboard/page.tsx` still references `MiniOrb` — this will be fixed in Task 6 when the page is rewritten.

- [ ] **Step 4: Commit**

```bash
git add client/components/ReadingOrb.tsx
git rm client/components/MiniOrb.tsx
git commit -m "feat: create ReadingOrb component replacing MiniOrb"
```

---

### Task 6: Rewrite Dashboard Page

**Files:**
- Modify: `client/app/dashboard/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

Replace the full content of `client/app/dashboard/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server';
import { BookCard } from '@/components/BookCard';
import { UploadCard } from '@/components/UploadCard';
import { ReadingOrb } from '@/components/ReadingOrb';
import { SignOutButton } from '@/components/SignOutButton';

type Book = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devUser = (user ?? { email: 'dev@localhost', id: 'dev' }) as any;

  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div
      className="dashboard-dark dashboard-panels min-h-screen"
      style={{
        background: 'var(--db-bg)',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, var(--db-glow) 0%, transparent 70%)',
      }}
    >
      {/* Panel 1: Orb Hero */}
      <div className="dashboard-panel dashboard-panel--orb">
        <ReadingOrb />
      </div>

      {/* Divider (desktop only) */}
      <div
        className="mx-auto hidden lg:block"
        style={{ width: 60, height: 1, background: 'var(--db-border)' }}
      />

      {/* Panel 2: Library */}
      <div className="dashboard-panel dashboard-panel--library">
        <div className="max-w-5xl mx-auto px-6 py-8 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <h1
              className="text-5xl"
              style={{ fontFamily: 'var(--font-caveat)', color: 'var(--db-primary)' }}
            >
              readme
            </h1>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ background: 'var(--db-accent)' }}
              >
                {devUser.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <SignOutButton />
            </div>
          </div>

          {/* Library heading */}
          <h2
            className="text-2xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-nunito)', color: 'var(--db-fg)' }}
          >
            Your Library
          </h2>

          {/* Book grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <UploadCard />
            {(books as Book[] | null)?.map((book) => (
              <BookCard
                key={book.id}
                bookId={book.id}
                title={book.title}
                status={book.status}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `cd client && pnpm build 2>&1 | tail -20`
Expected: Build succeeds with no errors. The dashboard page should compile.

- [ ] **Step 3: Commit**

```bash
git add client/app/dashboard/page.tsx
git commit -m "feat: rewrite dashboard with two-panel layout and CSS variables"
```

---

### Task 7: Add Auto-Connect to VoiceSession

**Files:**
- Modify: `client/components/VoiceSession.tsx`

- [ ] **Step 1: Add auto-connect logic**

In `client/components/VoiceSession.tsx`, add `useSearchParams` import and auto-connect `useEffect` inside `SessionInner`.

Add to imports at the top:

```tsx
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useEffect } from 'react';
```

(This replaces the existing `import { useRouter } from 'next/navigation';` and `import { useRef } from 'react';` lines.)

Add inside `SessionInner`, after the existing `const router = useRouter();` line:

```tsx
  const searchParams = useSearchParams();
  const autoConnectAttempted = useRef(false);

  useEffect(() => {
    if (searchParams.get('autoconnect') === 'true' && handleConnect && !autoConnectAttempted.current) {
      autoConnectAttempted.current = true;
      handleConnect();
    }
  }, [searchParams, handleConnect]);
```

- [ ] **Step 2: Wrap CallPage in Suspense**

Since `useSearchParams()` requires a Suspense boundary in Next.js App Router, update `client/app/call/page.tsx`. The `VoiceSession` is already a client component used inside the page, but the page itself uses `useSearchParams` indirectly. Wrap the content in `Suspense`:

In `client/app/call/page.tsx`, add `Suspense` import and wrap:

```tsx
'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { VoiceSession } from '@/components/VoiceSession';
import '@pipecat-ai/voice-ui-kit/styles.scoped';

export default function CallPage() {
  return (
    <motion.div
      className="fixed inset-0"
      style={{ background: '#150f20' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="vkui-root dark" style={{ width: '100%', height: '100%' }}>
        <div className="voice-ui-kit" style={{ width: '100%', height: '100%' }}>
          <Suspense>
            <VoiceSession />
          </Suspense>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `cd client && pnpm build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/components/VoiceSession.tsx client/app/call/page.tsx
git commit -m "feat: auto-connect call when navigating from dashboard orb"
```

---

## Chunk 3: Manual Verification

### Task 8: Visual Verification

- [ ] **Step 1: Start the app**

Run: `docker compose up -d` (if not already running)

- [ ] **Step 2: Verify dashboard at desktop width (1280px)**

Open `http://localhost:3000/dashboard` in a browser at 1280px width. Verify:
- Orb hero section is centered at top with "Start Reading" label
- Divider line visible between orb and library
- Library grid shows 4 columns (upload card first, then books)
- No hardcoded colors visible (all consistent dark lavender theme)
- Book cards show cover placeholder + title + status dot

- [ ] **Step 3: Verify responsive behavior**

Use browser DevTools to check:
- **390x844 (mobile portrait):** Vertical snap scroll, orb takes full viewport, scroll down snaps to library (2-column grid)
- **1024x768 landscape (tablet):** Horizontal snap scroll, swipe between orb and library panels (3-column grid)

- [ ] **Step 4: Verify upload still works**

Click the upload card, select a PDF, verify toast appears. Verify drag-and-drop works.

- [ ] **Step 5: Verify orb auto-connect**

Click the orb → should navigate to `/call?autoconnect=true` and call should start connecting automatically without clicking Connect.

- [ ] **Step 6: Verify `/call` without autoconnect**

Visit `http://localhost:3000/call` directly → Connect button should be present and call should NOT auto-start.
