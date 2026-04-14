# Forest UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the real app to match the approved wireframes in `/admin/design/*` — rework the header, split dashboard into Library + Readers routes, harmonize all card components, delete KidSelector, and add snapshot tests for every changed component.

**Architecture:** Six sequential task groups: (1) test harness, (2) shared components, (3) page-level components, (4) new routes, (5) cleanup, (6) verification. Each task is one focused change with TDD where applicable.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Framer Motion, Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-04-13-forest-ui-implementation.md`

---

## Task 1: Install Vitest + React Testing Library

**Files:**
- Modify: `client/package.json`
- Create: `client/vitest.config.ts`
- Create: `client/vitest.setup.ts`

- [ ] **Step 1: Install dev dependencies**

```bash
cd /Users/isabelleredactive/tmp/worktrees/readme/bot-ui/client
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 2: Create vitest.config.ts**

Create `client/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    css: false,
  },
});
```

- [ ] **Step 3: Create vitest.setup.ts**

Create `client/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Add scripts to package.json**

In `client/package.json`, add to `"scripts"`:

```json
"test": "vitest --run",
"test:watch": "vitest",
"test:update": "vitest --run --update"
```

Update `"github-checks"` to:

```json
"github-checks": "eslint && tsc --noEmit && vitest --run"
```

- [ ] **Step 5: Verify the test runner starts**

```bash
pnpm test 2>&1 | head -20
```

Expected: `No test files found` (no tests yet — that's correct).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json pnpm-lock.yaml
git commit -m "chore: add Vitest + React Testing Library test harness"
```

---

## Task 2: Rework `AppHeader`

**Files:**
- Modify: `client/components/AppHeader.tsx`
- Create: `client/components/__tests__/AppHeader.test.tsx`

- [ ] **Step 1: Write snapshot tests for the new AppHeader**

Create `client/components/__tests__/AppHeader.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppHeader } from '../AppHeader';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock EmberLogo to avoid SVG noise in snapshots
vi.mock('../EmberLogo', () => ({
  EmberLogo: ({ size, className }: { size: number; className: string }) => (
    <div data-testid="ember-logo" data-size={size} className={className} />
  ),
}));

describe('AppHeader', () => {
  it('renders default (home) — no back, no right slot', () => {
    const { container } = render(<AppHeader />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with back arrow and right slot', () => {
    const { container } = render(
      <AppHeader backHref="/h/abc" right={<div data-testid="avatar" />} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with custom subtitle', () => {
    const { container } = render(
      <AppHeader subtitle="Enchanted Forest Style Guide" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('hides wordmark on small screens by default', () => {
    const { container } = render(<AppHeader />);
    const wordmark = container.querySelector('[class*="hidden sm:block"]');
    expect(wordmark).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pnpm test -- components/__tests__/AppHeader.test.tsx 2>&1
```

Expected: FAIL — snapshots don't exist yet, and the component still has the old `center` prop / layout.

- [ ] **Step 3: Rewrite AppHeader.tsx**

Replace the full content of `client/components/AppHeader.tsx`:

```tsx
'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EmberLogo } from './EmberLogo';

interface AppHeaderProps {
  /** If provided, shows a back arrow that navigates to this route */
  backHref?: string;
  /** Content rendered in the right slot (e.g. profile avatar) */
  right?: ReactNode;
  /** Subtitle shown under the wordmark. Defaults to "Stories, read together" */
  subtitle?: string;
  /** Hide the "EmberTales" wordmark on small screens (default true) */
  hideWordmarkSm?: boolean;
}

export const AppHeader = ({
  backHref,
  right,
  subtitle = 'Stories, read together',
  hideWordmarkSm = true,
}: AppHeaderProps) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Left: back arrow + logo + wordmark + subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <EmberLogo size={40} className="text-primary shrink-0" />
          <div className={hideWordmarkSm ? 'hidden sm:block' : ''}>
            <h1 className="font-[family-name:var(--font-marcellus)] text-2xl font-bold text-foreground leading-tight">
              EmberTales
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: optional slot */}
        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </header>
  );
};
```

Key changes vs current:
- `EmberLogo size={40}` (was 32)
- Wordmark `text-2xl font-bold` (was `text-lg`)
- Added subtitle line (defaults to "Stories, read together")
- `py-4` (was `h-16`)
- Backdrop-blur matches admin/design header
- Removed `center` prop + mobile center rail
- Uses `bg-background/95` (was `bg-card`)

- [ ] **Step 4: Run tests — expect pass + snapshot creation**

```bash
pnpm test -- components/__tests__/AppHeader.test.tsx 2>&1
```

Expected: PASS, 4 snapshots written.

- [ ] **Step 5: Commit**

```bash
git add components/AppHeader.tsx components/__tests__/AppHeader.test.tsx
git commit -m "feat: rework AppHeader — taller, subtitle, drop center slot"
```

---

## Task 3: Rework `ProfileAvatar`

**Files:**
- Modify: `client/components/ProfileAvatar.tsx`
- Create: `client/components/__tests__/ProfileAvatar.test.tsx`

- [ ] **Step 1: Write snapshot tests**

Create `client/components/__tests__/ProfileAvatar.test.tsx`:

```tsx
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileAvatar } from '../ProfileAvatar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/h/abc123',
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseProps = {
  userName: 'Jane Doe',
  userEmail: 'jane@example.com',
  householdId: 'abc123',
};

describe('ProfileAvatar', () => {
  it('renders closed state — no hover tooltip', () => {
    const { container } = render(<ProfileAvatar {...baseProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders open popover with Library + Manage readers + Sign out + Delete', () => {
    const { container, getByText } = render(<ProfileAvatar {...baseProps} />);
    fireEvent.click(container.querySelector('button')!);
    expect(getByText('Library')).toBeTruthy();
    expect(getByText('Manage readers')).toBeTruthy();
    expect(getByText('Sign out')).toBeTruthy();
    expect(getByText('Delete account')).toBeTruthy();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('collapses Library row when currentPath is library', () => {
    const { container, getByText } = render(
      <ProfileAvatar {...baseProps} currentPath="library" />
    );
    fireEvent.click(container.querySelector('button')!);
    const libraryRow = getByText(/Library/);
    expect(libraryRow.closest('div')?.className).toContain('italic');
    expect(container.firstChild).toMatchSnapshot();
  });

  it('collapses Manage readers row when currentPath is readers', () => {
    const { container, getByText } = render(
      <ProfileAvatar {...baseProps} currentPath="readers" />
    );
    fireEvent.click(container.querySelector('button')!);
    const readersRow = getByText(/Manage readers/);
    expect(readersRow.closest('div')?.className).toContain('italic');
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pnpm test -- components/__tests__/ProfileAvatar.test.tsx 2>&1
```

Expected: FAIL — component still has old props/structure.

- [ ] **Step 3: Rewrite ProfileAvatar.tsx**

Replace the full content of `client/components/ProfileAvatar.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LogOut, Trash2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileAvatarProps {
  userName: string;
  userEmail: string;
  householdId: string;
  /** Which surface we're on — "library" or "readers". Matching row collapses. */
  currentPath?: 'library' | 'readers';
}

export const ProfileAvatar = ({ userName, userEmail, householdId, currentPath }: ProfileAvatarProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const initial = userName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? '?';
  const firstName = userName?.split(' ')[0] ?? userEmail?.split('@')[0] ?? '';

  const isLibrary = currentPath === 'library';
  const isReaders = currentPath === 'readers';

  const menuRowBase = 'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors';
  const activeRow = `${menuRowBase} text-muted-foreground cursor-default italic`;
  const clickableRow = `${menuRowBase} text-muted-foreground hover:bg-secondary cursor-pointer`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full ring-[3px] ring-primary/50 hover:ring-primary transition-all bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground cursor-pointer"
        aria-label="Account menu"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 w-72 rounded-xl border border-border bg-card shadow-lg z-30 overflow-hidden"
          >
            <div className="p-4 text-center border-b border-border">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto ring-[3px] ring-primary/20">
                {initial}
              </div>
              <p className="font-[family-name:var(--font-marcellus)] font-bold mt-2">Hi, {firstName}!</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>

            <div className="py-1">
              {/* Library */}
              {isLibrary ? (
                <div className={activeRow}>
                  <BookOpen className="w-4 h-4" />
                  <span>Library <span className="text-xs">(currently viewing)</span></span>
                </div>
              ) : (
                <button
                  onClick={() => { setOpen(false); router.push(`/h/${householdId}/library`); }}
                  className={clickableRow}
                >
                  <BookOpen className="w-4 h-4" />
                  Library
                </button>
              )}

              {/* Manage readers */}
              {isReaders ? (
                <div className={activeRow}>
                  <Users className="w-4 h-4" />
                  <span>Manage readers <span className="text-xs">(currently viewing)</span></span>
                </div>
              ) : (
                <button
                  onClick={() => { setOpen(false); router.push(`/h/${householdId}/readers`); }}
                  className={clickableRow}
                >
                  <Users className="w-4 h-4" />
                  Manage readers
                </button>
              )}

              {/* Divider */}
              <div className="border-t border-border my-1" />

              {/* Sign out */}
              <button onClick={handleSignOut} className={clickableRow}>
                <LogOut className="w-4 h-4" />
                Sign out
              </button>

              {/* Delete account */}
              <button
                onClick={() => { /* TODO: delete account flow */ }}
                className={`${menuRowBase} text-destructive hover:bg-destructive/10 cursor-pointer`}
              >
                <Trash2 className="w-4 h-4" />
                Delete account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

Key changes vs current:
- Removed hover tooltip `<div>` and `title` attribute (click-only per wireframe)
- Replaced single `manageHref` with `householdId` + `currentPath`
- Two nav rows: Library (BookOpen) + Manage readers (Users) with divider before Sign out
- Page-aware: matching row renders italic + "(currently viewing)" + no click handler

- [ ] **Step 4: Run tests — expect pass**

```bash
pnpm test -- components/__tests__/ProfileAvatar.test.tsx 2>&1
```

Expected: PASS, 4 snapshots written.

- [ ] **Step 5: Commit**

```bash
git add components/ProfileAvatar.tsx components/__tests__/ProfileAvatar.test.tsx
git commit -m "feat: rework ProfileAvatar — split menu, page-aware collapse, click-only"
```

---

## Task 4: Create `ReaderBookRow`

**Files:**
- Create: `client/components/ReaderBookRow.tsx`
- Create: `client/components/__tests__/ReaderBookRow.test.tsx`

- [ ] **Step 1: Write snapshot test**

Create `client/components/__tests__/ReaderBookRow.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReaderBookRow } from '../ReaderBookRow';

describe('ReaderBookRow', () => {
  it('renders with progress', () => {
    const { container } = render(
      <ReaderBookRow title="Where the Wild Things Are" progress={67} kidColor="#C56B8A" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders at zero progress', () => {
    const { container } = render(
      <ReaderBookRow title="The Gruffalo" progress={0} kidColor="#6B8FD4" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders at 100% progress', () => {
    const { container } = render(
      <ReaderBookRow title="Goodnight Moon" progress={100} kidColor="#8B6DAF" />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pnpm test -- components/__tests__/ReaderBookRow.test.tsx 2>&1
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create ReaderBookRow.tsx**

Create `client/components/ReaderBookRow.tsx`:

```tsx
interface ReaderBookRowProps {
  title: string;
  progress: number;
  kidColor: string;
}

export const ReaderBookRow = ({ title, progress, kidColor }: ReaderBookRowProps) => (
  <div className="rounded-lg bg-secondary/60 px-3 py-2">
    <div className="flex items-center justify-between text-sm mb-1">
      <span className="truncate text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground shrink-0 ml-2">{progress}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${progress}%`, backgroundColor: kidColor }}
      />
    </div>
  </div>
);
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pnpm test -- components/__tests__/ReaderBookRow.test.tsx 2>&1
```

Expected: PASS, 3 snapshots written.

- [ ] **Step 5: Commit**

```bash
git add components/ReaderBookRow.tsx components/__tests__/ReaderBookRow.test.tsx
git commit -m "feat: add ReaderBookRow component matching design wireframe"
```

---

## Task 5: Harmonize `BookCard` — kid variant h-44 hero + parent per-kid progress

**Files:**
- Modify: `client/components/BookCard.tsx`
- Create: `client/components/__tests__/BookCard.test.tsx`

- [ ] **Step 1: Write snapshot tests**

Create `client/components/__tests__/BookCard.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookCard } from '../BookCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, whileHover: _wh, whileTap: _wt, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
}));

vi.mock('@/lib/types', () => ({
  getCoverColor: () => '#5CB87A',
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ update: () => ({ eq: () => Promise.resolve({}) }) }),
  }),
}));

describe('BookCard kid variant', () => {
  it('renders with cover image and progress', () => {
    const { container } = render(
      <BookCard
        variant="kid"
        book={{
          id: 'book1',
          title: 'Where the Wild Things Are',
          author: 'Maurice Sendak',
          status: 'ready',
          coverImageUrl: 'https://example.com/cover.jpg',
          progress: 75,
        }}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders without cover image (fallback)', () => {
    const { container } = render(
      <BookCard
        variant="kid"
        book={{
          id: 'book2',
          title: 'The Gruffalo',
          status: 'ready',
          progress: 0,
        }}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders processing status', () => {
    const { container } = render(
      <BookCard
        variant="kid"
        book={{ id: 'book3', title: 'Test Book', status: 'processing' }}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('BookCard parent variant', () => {
  it('renders with per-kid progress rows', () => {
    const { container } = render(
      <BookCard
        variant="parent"
        book={{
          id: 'book1',
          title: "The Dragon's Garden",
          author: 'Emily Woods',
          status: 'ready',
          coverImageUrl: 'https://example.com/cover.jpg',
        }}
        kidProgress={[
          { kidId: 'k1', kidName: 'Fynn', kidColor: '#C56B8A', progress: 75 },
          { kidId: 'k2', kidName: 'Luca', kidColor: '#6B8FD4', progress: 25 },
        ]}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with no kid progress', () => {
    const { container } = render(
      <BookCard
        variant="parent"
        book={{
          id: 'book2',
          title: 'New Book',
          author: 'Author',
          status: 'ready',
        }}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pnpm test -- components/__tests__/BookCard.test.tsx 2>&1
```

Expected: FAIL — new props don't exist yet, kid variant still uses `aspect-[2/3]`.

- [ ] **Step 3: Rewrite BookCard.tsx**

Replace the full content of `client/components/BookCard.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Mic, Trash2, PencilLine, MoreVertical } from 'lucide-react';
import { getCoverColor } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface Book {
  id: string;
  title: string;
  author?: string | null;
  status: string;
  coverImageUrl?: string | null;
  progress?: number;
}

interface KidProgressEntry {
  kidId: string;
  kidName: string;
  kidColor: string;
  progress: number;
}

interface BookCardProps {
  book: Book;
  variant?: 'parent' | 'kid';
  /** Per-kid progress rows — parent variant only */
  kidProgress?: KidProgressEntry[];
  onStartReading?: (bookId: string) => void;
  onDelete?: (bookId: string) => void;
}

export const BookCard = ({
  book,
  variant = 'kid',
  kidProgress,
  onStartReading,
  onDelete,
}: BookCardProps) => {
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
        className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden cursor-pointer touch-manipulation transition-all hover:border-primary"
        onClick={() => book.status === 'ready' && onStartReading?.(book.id)}
      >
        {/* h-44 hero with gradient overlay + title */}
        <div
          className="relative h-44 overflow-hidden"
          style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
        >
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow line-clamp-2">
              {book.title}
            </p>
            {book.author && (
              <p className="text-xs text-white/80 mt-0.5">{book.author}</p>
            )}
          </div>
        </div>

        {/* Body: progress + CTA */}
        <div className="p-4 space-y-3">
          {progress > 0 && progress < 100 && (
            <div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{progress}% complete</p>
            </div>
          )}
          {progress === 100 && (
            <div className="inline-block bg-magic/10 text-magic px-3 py-1 rounded-full text-sm font-bold">
              Complete!
            </div>
          )}
          {book.status === 'ready' ? (
            <button
              className="w-full font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 transition-all"
              onClick={(e) => { e.stopPropagation(); onStartReading?.(book.id); }}
            >
              <Mic className="w-5 h-5" />
              {buttonLabel}
            </button>
          ) : (
            <span className="block text-xs text-muted-foreground capitalize">
              {book.status}&hellip;
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Parent variant
  return (
    <ParentBookCard
      book={book}
      coverColor={coverColor}
      progress={progress}
      kidProgress={kidProgress}
      onDelete={onDelete}
    />
  );
};

/* ── Parent variant ── */
const ParentBookCard = ({
  book,
  coverColor,
  progress,
  kidProgress,
  onDelete,
}: {
  book: Book;
  coverColor: string;
  progress: number;
  kidProgress?: KidProgressEntry[];
  onDelete?: (bookId: string) => void;
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author ?? 'Unknown');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleSave = async () => {
    const trimmedTitle = editTitle.trim();
    const trimmedAuthor = editAuthor.trim();
    if (!trimmedTitle) {
      setEditing(false);
      setEditTitle(book.title);
      setEditAuthor(book.author ?? 'Unknown');
      return;
    }

    const updates: Record<string, string> = {};
    if (trimmedTitle !== book.title) updates.title = trimmedTitle;
    if (trimmedAuthor !== (book.author ?? 'Unknown')) updates.author = trimmedAuthor;

    if (Object.keys(updates).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from('books').update(updates).eq('id', book.id);
      router.refresh();
    } catch {
      setEditTitle(book.title);
      setEditAuthor(book.author ?? 'Unknown');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className="flex rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors">
      {/* Cover thumbnail */}
      <div
        className="w-16 h-24 flex items-center justify-center shrink-0"
        style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
      >
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          <BookOpen className="w-8 h-8 text-white/80" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-1">
                  <input
                    ref={inputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') { setEditing(false); setEditTitle(book.title); setEditAuthor(book.author ?? 'Unknown'); }
                    }}
                    disabled={saving}
                    placeholder="Title"
                    className="w-full text-sm font-bold bg-transparent border-b border-primary outline-none"
                  />
                  <input
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') { setEditing(false); setEditTitle(book.title); setEditAuthor(book.author ?? 'Unknown'); }
                    }}
                    onBlur={handleSave}
                    disabled={saving}
                    placeholder="Author"
                    className="w-full text-xs bg-transparent border-b border-muted-foreground/30 outline-none text-muted-foreground"
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-[family-name:var(--font-marcellus)] font-semibold text-foreground truncate">{book.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{book.author} · {book.status}</p>
                </>
              )}
            </div>
            {/* Menu */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => { setMenuOpen(false); setEditing(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <PencilLine className="w-4 h-4" />
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(book.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Per-kid progress rows */}
        {kidProgress && kidProgress.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {kidProgress.map(({ kidId, kidName, kidColor, progress: kidPct }) => (
              <div key={kidId} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: kidColor }} />
                <span className="text-xs text-muted-foreground shrink-0 w-12 truncate">{kidName}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${kidPct}%`, backgroundColor: kidColor }} />
                </div>
                <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{kidPct}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Fallback: single aggregate progress bar when no kidProgress passed */}
        {(!kidProgress || kidProgress.length === 0) && progress > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};
```

Key changes vs current:
- **Kid variant:** `aspect-[2/3]` → `h-44` hero with gradient overlay + title + author overlay. Body simplified: `h-1.5` progress bar (was `h-2`), amber CTA with `rounded-xl` (was `rounded-2xl h-14`).
- **Parent variant:** cover `w-16 h-24` (was `w-24 h-32`). Author + status on one line. New `kidProgress` prop renders per-kid colored dots + progress rows matching wireframe. Fallback single bar for backward compat.

- [ ] **Step 4: Run tests — expect pass**

```bash
pnpm test -- components/__tests__/BookCard.test.tsx 2>&1
```

Expected: PASS, 5 snapshots written.

- [ ] **Step 5: Commit**

```bash
git add components/BookCard.tsx components/__tests__/BookCard.test.tsx
git commit -m "feat: harmonize BookCard — h-44 kid hero, per-kid parent progress"
```

---

## Task 6: Snapshot tests for `HomeCard` (KidCard + UploadCard)

The `HomeCard` component was already rewritten to the Strip Companion anatomy in prior work. This task adds snapshot coverage without modifying the component — proving it matches the wireframe.

**Files:**
- Create: `client/components/__tests__/HomeCard.test.tsx`

- [ ] **Step 1: Write snapshot tests**

Create `client/components/__tests__/HomeCard.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KidCard, UploadCard } from '../HomeCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, whileHover: _wh, whileTap: _wt, transition: _t, ...rest } = props;
      return <button {...rest}>{children as React.ReactNode}</button>;
    },
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: { POST: vi.fn() },
}));

describe('KidCard', () => {
  const basekid = { id: 'k1', name: 'Fynn', avatar: null, color: '#C56B8A' };

  it('renders populated — resuming a book', () => {
    const { container } = render(
      <KidCard
        householdId="h1"
        kid={basekid}
        lastBook={{ bookId: 'b1', bookTitle: 'Where the Wild Things Are', coverUrl: 'https://example.com/cover.jpg', progress: 67 }}
        readyBooks={[]}
        index={0}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders empty — no books', () => {
    const { container } = render(
      <KidCard
        householdId="h1"
        kid={{ id: 'k2', name: 'Luca', avatar: null, color: '#6B8FD4' }}
        lastBook={null}
        readyBooks={[]}
        index={1}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders single-book shortcut', () => {
    const { container } = render(
      <KidCard
        householdId="h1"
        kid={basekid}
        lastBook={null}
        readyBooks={[{ id: 'b1', title: 'The Gruffalo', author: 'Julia Donaldson', cover_image_url: null }]}
        index={0}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('UploadCard', () => {
  it('renders default state', () => {
    const { container } = render(
      <UploadCard householdId="h1" index={0} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run tests — expect pass (component already matches)**

```bash
pnpm test -- components/__tests__/HomeCard.test.tsx 2>&1
```

Expected: PASS, 4 snapshots written. These lock down the existing Strip Companion anatomy.

- [ ] **Step 3: Commit**

```bash
git add components/__tests__/HomeCard.test.tsx
git commit -m "test: add snapshot tests for HomeCard (KidCard + UploadCard)"
```

---

## Task 7: Update Home page — drop kid circles + footer

**Files:**
- Modify: `client/app/h/[householdId]/home-page.tsx`

- [ ] **Step 1: Rewrite home-page.tsx**

Replace the full content of `client/app/h/[householdId]/home-page.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { KidCard, UploadCard } from '@/components/HomeCard';

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  coverUrl: string | null;
  progress: number;
}

interface ReadyBook {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
}

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
  lastBook: KidLastBook | null;
}

interface HomePageProps {
  householdId: string;
  userEmail: string;
  userName: string;
  kids: Kid[];
  readyBooks: ReadyBook[];
}

export const HomePage = ({ householdId, userEmail, userName, kids, readyBooks }: HomePageProps) => {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <AppHeader
        right={
          <ProfileAvatar
            userName={userName}
            userEmail={userEmail}
            householdId={householdId}
          />
        }
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:flex-wrap">
          {kids.map((kid, i) => (
            <KidCard
              key={kid.id}
              householdId={householdId}
              kid={kid}
              lastBook={kid.lastBook}
              readyBooks={readyBooks}
              index={i}
            />
          ))}
          <UploadCard householdId={householdId} index={kids.length} />
        </div>

        {kids.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            No readers yet.{' '}
            <button
              onClick={() => router.push(`/h/${householdId}/readers`)}
              className="underline hover:text-foreground cursor-pointer"
            >
              Add one from Manage readers.
            </button>
          </p>
        )}
      </main>
    </div>
  );
};
```

Key changes vs current:
- Removed `rightSlot` with kid avatar circles (lines 42-56 of old file)
- `ProfileAvatar` now passes `householdId` instead of `manageHref`
- Removed `<footer>Stories, read together</footer>` (now in header subtitle)
- Empty state links to `/readers` instead of `/dashboard`

- [ ] **Step 2: Verify lint + types pass**

```bash
pnpm lint 2>&1 | grep -E 'error|Error' ; pnpm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/h/\[householdId\]/home-page.tsx
git commit -m "feat: update home page — drop kid circles, remove footer"
```

---

## Task 8: Create Library route

**Files:**
- Create: `client/app/h/[householdId]/library/page.tsx`
- Create: `client/app/h/[householdId]/library/library-client.tsx`
- Create: `client/app/h/[householdId]/library/loading.tsx`
- Create: `client/app/h/[householdId]/library/error.tsx`

- [ ] **Step 1: Create loading.tsx**

Create `client/app/h/[householdId]/library/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

- [ ] **Step 2: Create error.tsx**

Create `client/app/h/[householdId]/library/error.tsx`:

```tsx
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
      <h2 className="text-xl font-[family-name:var(--font-marcellus)] font-bold text-destructive">
        Something went wrong
      </h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create library-client.tsx**

Create `client/app/h/[householdId]/library/library-client.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { BookUpload } from '@/components/BookUpload';
import { BookCard } from '@/components/BookCard';
import { createClient } from '@/lib/supabase/client';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface KidProgress {
  kidId: string;
  progress: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  cover_image_url: string | null;
  created_at: string;
  kidProgress: KidProgress[];
}

interface Props {
  householdId: string;
  userEmail: string;
  userName: string;
  kids: Kid[];
  books: Book[];
}

export const LibraryClient = ({ householdId, userEmail, userName, kids, books }: Props) => {
  const router = useRouter();
  const kidMap = new Map(kids.map((k) => [k.id, k]));

  const handleDeleteBook = async (bookId: string) => {
    const supabase = createClient();
    await supabase.from('books').update({ status: 'deleted' }).eq('id', bookId);
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        backHref={`/h/${householdId}`}
        right={
          <ProfileAvatar
            userName={userName}
            userEmail={userEmail}
            householdId={householdId}
            currentPath="library"
          />
        }
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          <BookUpload householdId={householdId} compact />

          <div className="space-y-3">
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <BookCard
                  variant="parent"
                  book={{
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    status: book.status,
                    coverImageUrl: book.cover_image_url,
                  }}
                  kidProgress={book.kidProgress.map(({ kidId, progress }) => {
                    const kid = kidMap.get(kidId);
                    return {
                      kidId,
                      kidName: kid?.name ?? 'Unknown',
                      kidColor: kid?.color ?? '#5CB87A',
                      progress,
                    };
                  })}
                  onDelete={handleDeleteBook}
                />
              </motion.div>
            ))}
          </div>

          {books.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No books yet. Upload a PDF to get started.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
```

- [ ] **Step 4: Create library page.tsx (server component)**

Create `client/app/h/[householdId]/library/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LibraryClient } from './library-client';

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }
  if (householdId !== user.id) {
    redirect(`/h/${user.id}/library`);
  }

  const [{ data: kids }, { data: books }] = await Promise.all([
    supabase
      .from('kids')
      .select('id, name, avatar, color')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('books')
      .select('id, title, author, status, cover_image_url, created_at')
      .eq('household_id', householdId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }),
  ]);

  const kidIds = (kids ?? []).map((k) => k.id);
  const { data: progressRows } = kidIds.length > 0
    ? await supabase
        .from('reading_progress')
        .select('kid_id, book_id, current_chunk_index')
        .in('kid_id', kidIds)
    : { data: [] };

  const bookIds = (books ?? []).map((b) => b.id);
  const { data: chunkRows } = bookIds.length > 0
    ? await supabase.from('book_chunks').select('book_id').in('book_id', bookIds)
    : { data: [] };

  const totalChunksMap: Record<string, number> = {};
  (chunkRows ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  const bookProgress: Record<string, { kidId: string; progress: number }[]> = {};
  (progressRows ?? []).forEach((row) => {
    const total = totalChunksMap[row.book_id] ?? 1;
    const pct = Math.round((row.current_chunk_index / total) * 100);
    if (!bookProgress[row.book_id]) bookProgress[row.book_id] = [];
    bookProgress[row.book_id].push({ kidId: row.kid_id, progress: pct });
  });

  return (
    <LibraryClient
      householdId={householdId}
      userEmail={user.email ?? ''}
      userName={user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''}
      kids={kids ?? []}
      books={(books ?? []).map((b) => ({
        ...b,
        kidProgress: bookProgress[b.id] ?? [],
      }))}
    />
  );
}
```

- [ ] **Step 5: Verify lint + types pass**

```bash
pnpm lint 2>&1 | grep -E 'error|Error' ; pnpm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/h/\[householdId\]/library/
git commit -m "feat: add /library route — standalone books page"
```

---

## Task 9: Create Readers route

**Files:**
- Create: `client/app/h/[householdId]/readers/page.tsx`
- Create: `client/app/h/[householdId]/readers/readers-client.tsx`
- Create: `client/app/h/[householdId]/readers/loading.tsx`
- Create: `client/app/h/[householdId]/readers/error.tsx`

- [ ] **Step 1: Create loading.tsx**

Create `client/app/h/[householdId]/readers/loading.tsx`:

```tsx
export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

- [ ] **Step 2: Create error.tsx**

Create `client/app/h/[householdId]/readers/error.tsx`:

```tsx
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
      <h2 className="text-xl font-[family-name:var(--font-marcellus)] font-bold text-destructive">
        Something went wrong
      </h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create readers-client.tsx**

Create `client/app/h/[householdId]/readers/readers-client.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ReaderBookRow } from '@/components/ReaderBookRow';
import { AddKidDialog } from '@/components/AddKidDialog';
import { EditKidDialog } from '@/components/EditKidDialog';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface KidProgress {
  kidId: string;
  progress: number;
}

interface Book {
  id: string;
  title: string;
  kidProgress: KidProgress[];
}

interface Props {
  householdId: string;
  userEmail: string;
  userName: string;
  kids: Kid[];
  books: Book[];
}

export const ReadersClient = ({ householdId, userEmail, userName, kids, books }: Props) => {
  const [showAddKid, setShowAddKid] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);

  const kidBooks = (kidId: string) =>
    books
      .filter((b) => b.kidProgress.some((kp) => kp.kidId === kidId))
      .map((b) => ({
        title: b.title,
        progress: b.kidProgress.find((kp) => kp.kidId === kidId)?.progress ?? 0,
      }));

  const lastActive = (kidId: string) => {
    const booksWithProgress = books.filter((b) => b.kidProgress.some((kp) => kp.kidId === kidId));
    return booksWithProgress.length === 0 ? 'Never' : 'Recently';
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        backHref={`/h/${householdId}`}
        right={
          <ProfileAvatar
            userName={userName}
            userEmail={userEmail}
            householdId={householdId}
            currentPath="readers"
          />
        }
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-4">
          {kids.map((kid, index) => {
            const kidBookList = kidBooks(kid.id);
            const color = kid.color ?? '#5CB87A';

            return (
              <motion.div
                key={kid.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {kid.avatar ?? kid.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-[family-name:var(--font-marcellus)] font-bold text-sm">{kid.name}</h4>
                      <button
                        onClick={() => setEditingKid(kid)}
                        className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
                        aria-label={`Edit ${kid.name}`}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {kidBookList.length} {kidBookList.length === 1 ? 'book' : 'books'} · Last active: {lastActive(kid.id)}
                    </p>
                    {kidBookList.length > 0 ? (
                      <div className="space-y-2">
                        {kidBookList.map((book) => (
                          <ReaderBookRow
                            key={book.title}
                            title={book.title}
                            progress={book.progress}
                            kidColor={color}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No reading activity yet</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          <button
            onClick={() => setShowAddKid(true)}
            className="w-full rounded-xl border-2 border-dashed border-border p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground hover:bg-primary/5 cursor-pointer transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">Add a reader</span>
          </button>

          {kids.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No readers yet. Add one to get started.
            </p>
          )}
        </div>
      </main>

      <AddKidDialog householdId={householdId} open={showAddKid} onClose={() => setShowAddKid(false)} />
      {editingKid && (
        <EditKidDialog kid={editingKid} open={!!editingKid} onClose={() => setEditingKid(null)} />
      )}
    </div>
  );
};
```

- [ ] **Step 4: Create readers page.tsx (server component)**

Create `client/app/h/[householdId]/readers/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReadersClient } from './readers-client';

export default async function ReadersPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }
  if (householdId !== user.id) {
    redirect(`/h/${user.id}/readers`);
  }

  const [{ data: kids }, { data: books }] = await Promise.all([
    supabase
      .from('kids')
      .select('id, name, avatar, color')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('books')
      .select('id, title, status, created_at')
      .eq('household_id', householdId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }),
  ]);

  const kidIds = (kids ?? []).map((k) => k.id);
  const { data: progressRows } = kidIds.length > 0
    ? await supabase
        .from('reading_progress')
        .select('kid_id, book_id, current_chunk_index')
        .in('kid_id', kidIds)
    : { data: [] };

  const bookIds = (books ?? []).map((b) => b.id);
  const { data: chunkRows } = bookIds.length > 0
    ? await supabase.from('book_chunks').select('book_id').in('book_id', bookIds)
    : { data: [] };

  const totalChunksMap: Record<string, number> = {};
  (chunkRows ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  const bookProgress: Record<string, { kidId: string; progress: number }[]> = {};
  (progressRows ?? []).forEach((row) => {
    const total = totalChunksMap[row.book_id] ?? 1;
    const pct = Math.round((row.current_chunk_index / total) * 100);
    if (!bookProgress[row.book_id]) bookProgress[row.book_id] = [];
    bookProgress[row.book_id].push({ kidId: row.kid_id, progress: pct });
  });

  return (
    <ReadersClient
      householdId={householdId}
      userEmail={user.email ?? ''}
      userName={user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''}
      kids={kids ?? []}
      books={(books ?? []).map((b) => ({
        id: b.id,
        title: b.title,
        kidProgress: bookProgress[b.id] ?? [],
      }))}
    />
  );
}
```

- [ ] **Step 5: Verify lint + types pass**

```bash
pnpm lint 2>&1 | grep -E 'error|Error' ; pnpm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add app/h/\[householdId\]/readers/
git commit -m "feat: add /readers route — standalone kid panels page"
```

---

## Task 10: Redirect `/dashboard` → `/library` + update kid home header

**Files:**
- Modify: `client/app/h/[householdId]/dashboard/page.tsx`
- Delete: `client/app/h/[householdId]/dashboard/dashboard-client.tsx`
- Modify: `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx`

- [ ] **Step 1: Replace dashboard page.tsx with redirect**

Replace `client/app/h/[householdId]/dashboard/page.tsx` with:

```tsx
import { redirect } from 'next/navigation';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  redirect(`/h/${householdId}/library`);
}
```

- [ ] **Step 2: Delete dashboard-client.tsx**

```bash
rm client/app/h/\[householdId\]/dashboard/dashboard-client.tsx
```

- [ ] **Step 3: Update kid-home-client.tsx — confirm header has no right slot**

The current `kid-home-client.tsx` already uses `<AppHeader backHref={...} />` with no right slot — which matches the wireframe (kid surface, no parent menu). However, update the heading font class from `font-display` to the correct token:

In `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx`, replace:

```tsx
            <motion.h2
              className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2"
```

with:

```tsx
            <motion.h2
              className="font-[family-name:var(--font-marcellus)] text-3xl md:text-4xl font-bold text-foreground mb-2"
```

Also replace both instances of `font-display` in section headings:

```tsx
            <h3 className="font-display text-xl font-bold text-foreground mb-4">Continue Reading</h3>
```

with:

```tsx
            <h3 className="font-[family-name:var(--font-marcellus)] text-xl font-bold text-foreground mb-4">Continue Reading</h3>
```

And:

```tsx
          <h3 className="font-display text-xl font-bold text-foreground mb-4">My Books</h3>
```

with:

```tsx
          <h3 className="font-[family-name:var(--font-marcellus)] text-xl font-bold text-foreground mb-4">My Books</h3>
```

- [ ] **Step 4: Verify lint + types pass**

```bash
pnpm lint 2>&1 | grep -E 'error|Error' ; pnpm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/h/\[householdId\]/dashboard/page.tsx app/h/\[householdId\]/kid/\[kidId\]/kid-home-client.tsx
git rm app/h/\[householdId\]/dashboard/dashboard-client.tsx
git commit -m "feat: redirect /dashboard → /library, clean kid-home font tokens"
```

---

## Task 11: Delete KidSelector

**Files:**
- Delete: `client/components/KidSelector.tsx`

- [ ] **Step 1: Verify no imports exist**

```bash
cd /Users/isabelleredactive/tmp/worktrees/readme/bot-ui/client
grep -r "KidSelector" --include="*.tsx" --include="*.ts" -l | grep -v "__tests__" | grep -v "admin/design"
```

Expected: only `components/KidSelector.tsx` (definition only, no imports).

- [ ] **Step 2: Delete the file**

```bash
rm components/KidSelector.tsx
```

- [ ] **Step 3: Verify lint + types still pass**

```bash
pnpm lint 2>&1 | grep -E 'error|Error' ; pnpm typecheck 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git rm components/KidSelector.tsx
git commit -m "chore: remove unused KidSelector component"
```

---

## Task 12: Full verification pass

- [ ] **Step 1: Run full lint**

```bash
pnpm lint 2>&1
```

Expected: 0 errors (warnings for `<img>` are pre-existing and acceptable).

- [ ] **Step 2: Run full typecheck**

```bash
pnpm typecheck 2>&1
```

Expected: 0 errors.

- [ ] **Step 3: Run all snapshot tests**

```bash
pnpm test 2>&1
```

Expected: all tests PASS, all snapshots committed.

- [ ] **Step 4: Verify snapshot files exist and are committed**

```bash
ls components/__tests__/__snapshots__/
git status
```

Expected: 5 `.snap` files (AppHeader, ProfileAvatar, BookCard, HomeCard, ReaderBookRow). All tracked.

- [ ] **Step 5: Manual smoke test (if dev server running)**

Visit each route and verify against wireframes:
- `/h/{id}` — home page with strip cards, no footer, taller header with subtitle
- `/h/{id}/library` — books list with per-kid progress dots, back arrow + avatar
- `/h/{id}/readers` — kid panels with ReaderBookRow, back arrow + avatar
- `/h/{id}/kid/{kidId}` — kid greeting + h-44 book grid, back arrow only
- `/h/{id}/dashboard` — redirects to `/library`
- ProfileAvatar: click opens popover with Library + Manage readers + divider + Sign out + Delete
- On `/library`: "Library" row shows italic "(currently viewing)"
- On `/readers`: "Manage readers" row shows italic "(currently viewing)"

- [ ] **Step 6: Final commit with snapshots**

```bash
git add -A components/__tests__/__snapshots__/
git status
git commit -m "chore: commit snapshot files for review"
```

---

## Summary of all commits (expected 12)

1. `chore: add Vitest + React Testing Library test harness`
2. `feat: rework AppHeader — taller, subtitle, drop center slot`
3. `feat: rework ProfileAvatar — split menu, page-aware collapse, click-only`
4. `feat: add ReaderBookRow component matching design wireframe`
5. `feat: harmonize BookCard — h-44 kid hero, per-kid parent progress`
6. `test: add snapshot tests for HomeCard (KidCard + UploadCard)`
7. `feat: update home page — drop kid circles, remove footer`
8. `feat: add /library route — standalone books page`
9. `feat: add /readers route — standalone kid panels page`
10. `feat: redirect /dashboard → /library, clean kid-home font tokens`
11. `chore: remove unused KidSelector component`
12. `chore: commit snapshot files for review`
