# Dashboard Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix book upload, add rename/delete actions to book cards, make the dashboard orb match the call page orb visually.

**Architecture:** BookCard gets a context menu (three-dot button) with rename/delete. Rename uses inline editing. Delete soft-deletes by setting `status='deleted'` via Supabase RPC from client. Upload is fixed by passing `household_id` in the FormData. The ReadingOrb Plasma component is resized to match the call page's full-container orb.

**Tech Stack:** Next.js 16 (App Router, React 19), Tailwind v4, Framer Motion, Supabase (client-side RPC), openapi-fetch

---

## File Structure

| File | Responsibility |
|------|---------------|
| `client/components/ReadingOrb.tsx` | Modify — larger Plasma canvas matching call page |
| `client/components/UploadCard.tsx` | Modify — pass `household_id` in FormData |
| `client/components/BookCard.tsx` | Modify — add three-dot menu with rename/delete actions |
| `client/app/dashboard/page.tsx` | Modify — pass `household_id` to UploadCard, filter deleted books |
| `client/app/dashboard/layout.tsx` | Modify — pass `household_id` down from user lookup |
| `client/app/globals.css` | Minor — add orb panel sizing tweaks if needed |

---

## Chunk 1: Fix Upload + Orb Visual

### Task 1: Fix Upload — Pass household_id

The upload fails with 422 because the frontend doesn't send `household_id` in the FormData. The FastAPI endpoint at `server/api/admin.py:55-106` requires it.

**Current problem:** `UploadCard` sends only `file` in FormData. The backend requires `household_id` as a form field.

**Solution:** The dashboard page already has access to the user via Supabase auth. We'll use the user's `id` as `household_id` (they're the same in this app's data model) and pass it as a prop to `UploadCard`.

**Files:**
- Modify: `client/components/UploadCard.tsx`
- Modify: `client/app/dashboard/page.tsx`

- [ ] **Step 1: Add `householdId` prop to UploadCard**

In `client/components/UploadCard.tsx`, add a prop and include it in the FormData:

Change the component signature from:
```tsx
export const UploadCard = () => {
```
To:
```tsx
interface UploadCardProps {
  householdId: string;
}

export const UploadCard = ({ householdId }: UploadCardProps) => {
```

Change the `bodySerializer` inside `handleFile` from:
```tsx
        bodySerializer: () => {
          const form = new FormData();
          form.append('file', file);
          return form;
        },
```
To:
```tsx
        bodySerializer: () => {
          const form = new FormData();
          form.append('file', file);
          form.append('household_id', householdId);
          return form;
        },
```

- [ ] **Step 2: Pass householdId from dashboard page**

In `client/app/dashboard/page.tsx`, the page already creates a Supabase client and could get the user. But we moved user fetching to the layout. We need to pass the user's ID to the page.

Actually, the simplest approach: fetch the user in the page too (Supabase deduplicates requests). Add user fetch back and pass to UploadCard:

After the existing `const supabase = await createClient();` line, add:
```tsx
  const { data: { user } } = await supabase.auth.getUser();
  const householdId = user?.id ?? 'dev';
```

Then change `<UploadCard />` to `<UploadCard householdId={householdId} />`.

Also add the import for `createClient` if not already there (it should already be imported for the books query).

- [ ] **Step 3: Add `router.refresh()` after successful upload**

The dashboard is a Server Component — after upload, the new book won't appear without a refresh. In `UploadCard.tsx`, add `useRouter` and call `router.refresh()` after success:

Add to imports:
```tsx
import { useRouter } from 'next/navigation';
```

Add inside the component, after `const [uploading, setUploading] = useState(false);`:
```tsx
  const router = useRouter();
```

After the success toast in `handleFile` (after `toast({ title: 'Book uploaded!', ... })`), add:
```tsx
      router.refresh();
```

- [ ] **Step 4: Build and verify**

Run: `cd client && pnpm build 2>&1 | tail -15`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add client/components/UploadCard.tsx client/app/dashboard/page.tsx
git commit -m "fix: pass household_id in upload FormData and refresh after upload"
```

---

### Task 2: Make ReadingOrb Match Call Page Orb

The call page renders Plasma at `width={600} height={600}` filling its container (`style={{ width: '100%', height: '100%' }}`). The dashboard ReadingOrb renders at `width={240} height={240}` displayed at 120x120px — much smaller and less impressive.

**Solution:** Make the ReadingOrb Plasma fill its container (like the call page), and control size via the `.reading-orb` CSS class + the panel sizing. Remove the microphone icon overlay (the call page orb doesn't have one — it's just the plasma).

**Files:**
- Modify: `client/components/ReadingOrb.tsx`
- Modify: `client/app/globals.css`

- [ ] **Step 1: Update ReadingOrb Plasma to fill container**

In `client/components/ReadingOrb.tsx`, change the `PlasmaWrapper` inside the dynamic import from:
```tsx
      const PlasmaWrapper = () => (
        <Plasma
          width={240}
          height={240}
          initialConfig={PLASMA_CONFIG}
          audioTrack={undefined}
          style={{ width: 120, height: 120 }}
        />
      );
```
To:
```tsx
      const PlasmaWrapper = () => (
        <Plasma
          width={600}
          height={600}
          initialConfig={PLASMA_CONFIG}
          audioTrack={undefined}
          style={{ width: '100%', height: '100%' }}
        />
      );
```

Also update `CSSGradientOrb` to fill its container:
```tsx
const CSSGradientOrb = () => (
  <div
    className="rounded-full w-full h-full"
    style={{
      background: 'radial-gradient(circle at 35% 35%, var(--db-primary), var(--db-accent))',
    }}
  />
);
```

- [ ] **Step 2: Remove the Microphone icon overlay**

In the `ReadingOrb` component, remove the Microphone icon overlay div entirely. Remove the `Microphone` import. The orb should be just the plasma animation.

Delete this block:
```tsx
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Microphone weight="fill" size={28} color="#fff" />
          </div>
```

And remove from imports:
```tsx
import { Microphone } from '@phosphor-icons/react';
```

- [ ] **Step 3: Update orb panel CSS for larger orb**

In `client/app/globals.css`, update the `.reading-orb` and `.dashboard-panel--orb` classes to make the orb larger and more prominent:

Replace the existing `.reading-orb` block:
```css
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
```

With:
```css
.reading-orb {
  width: 200px;
  height: 200px;
}

@media (min-width: 1025px) {
  .reading-orb {
    width: 180px;
    height: 180px;
  }
}
```

- [ ] **Step 4: Build and verify**

Run: `cd client && pnpm build 2>&1 | tail -15`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add client/components/ReadingOrb.tsx client/app/globals.css
git commit -m "feat: enlarge ReadingOrb to match call page plasma style"
```

---

## Chunk 2: Book Rename and Delete

### Task 3: Add Rename and Delete to BookCard

BookCard needs a three-dot menu button that reveals rename and delete actions. Rename does inline title editing. Delete sets `status='deleted'` via Supabase.

Since BookCard is a client component, it can use the Supabase browser client directly for these mutations. After mutation, call `router.refresh()` to re-fetch the server component data.

**Files:**
- Modify: `client/components/BookCard.tsx`

- [ ] **Step 1: Rewrite BookCard with actions**

Replace the full content of `client/components/BookCard.tsx`:

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { DotsThreeVertical, PencilSimple, Trash, Check, X } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

export const BookCard = ({ bookId, title, status }: BookCardProps) => {
  const statusInfo = statusConfig[status] ?? statusConfig.processing;
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Close menu when clicking outside
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

  const handleRename = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === title) {
      setEditing(false);
      setEditTitle(title);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ title: trimmed })
        .eq('id', bookId);

      if (error) throw error;
      router.refresh();
    } catch {
      setEditTitle(title);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ status: 'deleted' })
        .eq('id', bookId);

      if (error) throw error;
      router.refresh();
    } catch {
      // Silently fail — book stays visible
    } finally {
      setSaving(false);
      setMenuOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') {
      setEditing(false);
      setEditTitle(title);
    }
  };

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        background: 'var(--db-card)',
        border: '1px solid var(--db-card-border)',
        opacity: saving ? 0.6 : 1,
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

      {/* Three-dot menu button */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: menuOpen ? 'var(--db-muted)' : 'transparent' }}
          aria-label="Book actions"
        >
          <DotsThreeVertical size={18} weight="bold" color="var(--db-muted-fg)" />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 mt-1 rounded-xl overflow-hidden z-10"
              style={{
                background: 'var(--db-card)',
                border: '1px solid var(--db-border)',
                minWidth: 140,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); setEditing(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                style={{ color: 'var(--db-fg)', fontFamily: 'var(--font-nunito)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <PencilSimple size={14} weight="bold" />
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                style={{ color: 'var(--coral)', fontFamily: 'var(--font-nunito)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash size={14} weight="bold" />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text area */}
      <div className="p-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRename}
              className="text-sm font-semibold leading-snug w-full bg-transparent outline-none rounded px-1"
              style={{
                color: 'var(--db-fg)',
                fontFamily: 'var(--font-nunito)',
                border: '1px solid var(--db-border)',
              }}
            />
          </div>
        ) : (
          <p
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--db-fg)', fontFamily: 'var(--font-nunito)' }}
          >
            {title}
          </p>
        )}
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

- [ ] **Step 2: Verify no unused imports**

Check that `Check` and `X` icons are removed from the import if not used (they were in the import but the simplified inline edit uses blur/enter instead of confirm/cancel buttons). Update the import to:

```tsx
import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react';
```

- [ ] **Step 3: Build and verify**

Run: `cd client && pnpm build 2>&1 | tail -15`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/components/BookCard.tsx
git commit -m "feat: add rename and delete actions to BookCard"
```

---

### Task 4: Filter Deleted Books in Dashboard Query

Books with `status='deleted'` should not appear in the library grid.

**Files:**
- Modify: `client/app/dashboard/page.tsx`

- [ ] **Step 1: Add filter to Supabase query**

In `client/app/dashboard/page.tsx`, change the books query from:

```tsx
  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false });
```

To:

```tsx
  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, created_at')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });
```

- [ ] **Step 2: Build and verify**

Run: `cd client && pnpm build 2>&1 | tail -15`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/app/dashboard/page.tsx
git commit -m "feat: filter deleted books from dashboard library"
```

---

## Chunk 3: Manual Verification

### Task 5: Visual and Functional Verification

- [ ] **Step 1: Restart the app**

Run: `docker compose down && docker compose up -d`
Wait for containers to be healthy.

- [ ] **Step 2: Verify orb appearance**

Open `http://localhost:3000/dashboard`. The ReadingOrb should now be a large plasma animation (200px on mobile, 180px on desktop) that looks like a smaller version of the call page orb. No microphone icon overlay.

- [ ] **Step 3: Verify book upload**

Click the upload card, select a PDF. Verify:
- Upload succeeds (success toast appears)
- New book appears in the grid after upload (page refreshes automatically)

- [ ] **Step 4: Verify book rename**

Click the three-dot menu on a book card → Rename. Verify:
- Title becomes editable inline
- Press Enter → saves new title, title updates
- Press Escape → cancels edit

- [ ] **Step 5: Verify book delete**

Click the three-dot menu on a book card → Delete. Verify:
- Book disappears from the grid
- Book still exists in database with `status='deleted'` (check Supabase dashboard if needed)

- [ ] **Step 6: Verify call page unchanged**

Navigate to `/call` directly and via the orb. Verify the call page orb still works as before.
