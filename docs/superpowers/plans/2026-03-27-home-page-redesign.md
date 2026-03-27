# Home Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Mode Selector with a single home page that shows kid resume cards and an inline upload card, reducing taps-to-read from 4 to 1-2 and taps-to-upload from 3 to 1.

**Architecture:** The Mode Selector (`/h/{householdId}`) becomes a card strip — one card per kid (showing last-read book + continue button) plus an upload card with an inline file picker. The parent dashboard loses its Upload tab (merged into Library). Kid PATCH/DELETE endpoints are added to the backend. Font regression from shadcn init is fixed.

**Tech Stack:** Next.js 16 (App Router, React 19), TypeScript, Tailwind v4, Framer Motion, Supabase, FastAPI (Python)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Fix | `client/app/layout.tsx` | Remove Geist font, restore Nunito/Baloo only |
| Fix | `client/app/globals.css` | Remove `html { @apply font-sans }` rule added by shadcn init |
| Replace | `client/app/h/[householdId]/mode-selector.tsx` | New home page with card strip layout |
| Modify | `client/app/h/[householdId]/page.tsx` | Add per-kid reading progress + last book query |
| Create | `client/components/HomeCard.tsx` | Kid card and upload card components |
| Create | `client/components/EditKidDialog.tsx` | Edit name/color + delete kid dialog |
| Modify | `client/components/KidSelector.tsx` | Add edit icon on hover per kid |
| Modify | `client/app/h/[householdId]/dashboard/dashboard-client.tsx` | Remove Upload tab, merge upload zone into Library |
| Modify | `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx` | Better empty state, language cleanup |
| Modify | `server/api/routers/kids.py` | Add PATCH and DELETE endpoints |

---

## Task 1: Fix Font Regression

**Files:**
- Fix: `client/app/layout.tsx`
- Fix: `client/app/globals.css`

**Context:** The shadcn/ui init added Geist font and set `--font-sans` to Geist on `<html>`, overriding the design system's Nunito. The design uses Baloo 2 for display (`font-display`) and Nunito for body (`font-sans`). Geist is not part of the design.

- [ ] **Step 1: Remove Geist from layout.tsx**

In `client/app/layout.tsx`, revert to the committed version's font setup:

```tsx
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

Remove: `Geist` import, `geist` const, `cn` import, `cn("font-sans", geist.variable)` from `<html>`.

- [ ] **Step 2: Clean up globals.css**

In `client/app/globals.css`, remove the `html` rule that shadcn added inside `@layer base`:

```css
/* REMOVE this block: */
html {
  @apply font-sans;
}
```

Keep `@import "shadcn/tailwind.css"` — it's needed for shadcn component styles.

Keep the sidebar/chart theme variables that shadcn added in `@theme inline` — they're harmless and may be needed later.

- [ ] **Step 3: Verify fonts render**

```bash
cd client && pnpm dev
```

Open any page. Body text should render in Nunito. Headings with `font-display` class should render in Baloo 2. Check auth page, onboarding, and dashboard.

- [ ] **Step 4: Commit**

```bash
git add client/app/layout.tsx client/app/globals.css
git commit -m "fix: restore Nunito/Baloo fonts — remove Geist override from shadcn init"
```

---

## Task 2: Backend — Kid PATCH and DELETE Endpoints

**Files:**
- Modify: `server/api/routers/kids.py`

**Context:** Only `POST /kids` exists. We need `PATCH /kids/{kid_id}` (update name/color) and `DELETE /kids/{kid_id}` (remove kid and their reading progress). The existing POST endpoint uses `apiClient.POST('/kids', { body })` from the frontend. The router is registered in `server/api/main.py` (line 33).

- [ ] **Step 1: Read existing kids router**

Read `server/api/routers/kids.py` to understand the existing pattern (models, Supabase client usage, response schema).

- [ ] **Step 2: Add PATCH endpoint**

Add to `server/api/routers/kids.py`:

```python
class KidUpdateRequest(BaseModel):
    name: str | None = None
    color: str | None = None

@router.patch("/kids/{kid_id}")
async def update_kid(kid_id: str, request: KidUpdateRequest):
    updates = request.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # If name changed, update avatar to first letter
    if "name" in updates:
        updates["avatar"] = updates["name"][0].upper()

    result = supabase.table("kids").update(updates).eq("id", kid_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Kid not found")
    return result.data[0]
```

- [ ] **Step 3: Add DELETE endpoint**

Add to `server/api/routers/kids.py`:

```python
@router.delete("/kids/{kid_id}", status_code=204)
async def delete_kid(kid_id: str):
    # Delete reading progress first (foreign key)
    supabase.table("reading_progress").delete().eq("kid_id", kid_id).execute()
    result = supabase.table("kids").delete().eq("id", kid_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Kid not found")
```

- [ ] **Step 4: Test endpoints manually**

```bash
cd server && uv run uvicorn api.main:app --reload
```

Test with curl:
```bash
# Create a test kid
curl -X POST http://localhost:8000/kids -H "Content-Type: application/json" -d '{"household_id":"test","name":"Luna","color":"#F472B6"}'

# Update
curl -X PATCH http://localhost:8000/kids/{kid_id} -H "Content-Type: application/json" -d '{"name":"Luna Star"}'

# Delete
curl -X DELETE http://localhost:8000/kids/{kid_id}
```

- [ ] **Step 5: Commit**

```bash
git add server/api/routers/kids.py
git commit -m "feat: add PATCH and DELETE endpoints for /kids/{kid_id}"
```

---

## Task 3: New Home Page — Card Strip Layout

**Files:**
- Create: `client/components/HomeCard.tsx`
- Replace: `client/app/h/[householdId]/mode-selector.tsx`
- Modify: `client/app/h/[householdId]/page.tsx`

**Context:** The current Mode Selector shows "Parent Mode" and "Kid Mode" cards. Replace it with a horizontal card strip (desktop) / vertical stack (mobile) showing one card per kid + one upload card. Each kid card shows their last-read book with a "Continue" button or a "Browse" button if no progress. Upload card has an inline file picker.

**Design guidelines (from frontend-design skill):**
- Use Baloo 2 for card headings, Nunito for body text
- Use the existing color system: kid's own color for card accent, dashed border for upload card
- Motion: staggered card entrance with `framer-motion`, hover scale
- Cards should be large and spacious — like the BookCard kid variant
- Language: warm but not childish. "Continue", "Browse books", "Add a book" — not "Start a reading adventure!"

### Step-by-step

- [ ] **Step 1: Update server component to fetch reading progress per kid**

In `client/app/h/[householdId]/page.tsx`, after fetching kids, fetch each kid's most recent reading progress joined with book title:

```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomePage } from './home-page';

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actualHouseholdId = user?.id ?? 'test_household';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}`);
  }

  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, avatar, color')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  // Fetch last reading progress per kid with book info
  const kidIds = (kids ?? []).map((k) => k.id);
  const { data: progressRows } = kidIds.length > 0
    ? await supabase
        .from('reading_progress')
        .select('kid_id, book_id, current_chunk_index, books(id, title, cover_image_url)')
        .in('kid_id', kidIds)
    : { data: [] };

  // Get total chunk counts for books in progress
  const bookIds = [...new Set((progressRows ?? []).map((r) => r.book_id))];
  const { data: chunkRows } = bookIds.length > 0
    ? await supabase.from('book_chunks').select('book_id').in('book_id', bookIds)
    : { data: [] };

  const totalChunksMap: Record<string, number> = {};
  (chunkRows ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  // Build per-kid last book info
  const kidProgress: Record<string, { bookId: string; bookTitle: string; coverUrl: string | null; progress: number }> = {};
  (progressRows ?? []).forEach((row) => {
    const total = totalChunksMap[row.book_id] ?? 1;
    const pct = Math.round((row.current_chunk_index / total) * 100);
    const existing = kidProgress[row.kid_id];
    // Keep the one with highest progress (most recent activity)
    if (!existing || pct > existing.progress) {
      const book = row.books as { id: string; title: string; cover_image_url: string | null } | null;
      kidProgress[row.kid_id] = {
        bookId: row.book_id,
        bookTitle: book?.title ?? 'Untitled',
        coverUrl: book?.cover_image_url ?? null,
        progress: pct,
      };
    }
  });

  // Count total books to know if household has any
  const { count: bookCount } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .neq('status', 'deleted');

  return (
    <HomePage
      householdId={householdId}
      kids={(kids ?? []).map((k) => ({
        ...k,
        lastBook: kidProgress[k.id] ?? null,
      }))}
      hasBooks={(bookCount ?? 0) > 0}
    />
  );
}
```

- [ ] **Step 2: Create HomeCard component**

Create `client/components/HomeCard.tsx`:

```tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileText, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  coverUrl: string | null;
  progress: number;
}

interface KidCardProps {
  householdId: string;
  kid: {
    id: string;
    name: string;
    avatar: string | null;
    color: string | null;
  };
  lastBook: KidLastBook | null;
  hasBooks: boolean;
  index: number;
}

export const KidCard = ({ householdId, kid, lastBook, hasBooks, index }: KidCardProps) => {
  const router = useRouter();
  const color = kid.color ?? '#60A5FA';

  const handleAction = () => {
    if (lastBook && lastBook.progress > 0 && lastBook.progress < 100) {
      // Continue reading — go straight to voice session
      router.push(`/h/${householdId}/kid/${kid.id}/call?bookId=${lastBook.bookId}`);
    } else {
      // Browse books
      router.push(`/h/${householdId}/kid/${kid.id}`);
    }
  };

  const isResuming = lastBook && lastBook.progress > 0 && lastBook.progress < 100;

  return (
    <motion.button
      onClick={handleAction}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full cursor-pointer rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-lg flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Color accent stripe */}
      <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl" style={{ backgroundColor: color }} />

      {/* Kid identity */}
      <div className="flex items-center gap-3 pt-2">
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
          style={{ backgroundColor: color }}
        >
          {kid.avatar ?? kid.name[0]?.toUpperCase()}
        </span>
        <h3 className="font-display text-xl font-bold text-foreground">{kid.name}</h3>
      </div>

      {/* Book info or empty state */}
      {isResuming ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="truncate">{lastBook.bookTitle}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${lastBook.progress}%`, backgroundColor: color }}
            />
          </div>
          <span className="inline-block text-sm font-semibold" style={{ color }}>
            Continue &rarr;
          </span>
        </div>
      ) : hasBooks ? (
        <div>
          <span className="text-sm text-muted-foreground">
            {lastBook?.progress === 100 ? 'Finished! Pick another' : 'Browse books'}
          </span>
          <span className="block text-sm font-semibold mt-1" style={{ color }}>
            Browse &rarr;
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">No books yet</span>
      )}
    </motion.button>
  );
};

interface UploadCardProps {
  householdId: string;
  index: number;
}

export const UploadCard = ({ householdId, index }: UploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

  const uploadFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({ title: 'Only PDF files are supported', variant: 'destructive' });
      return;
    }
    setUploading(true);
    setFileName(file.name);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('household_id', householdId);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/books/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      toast({ title: 'Book uploaded!' });
      router.refresh();
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      setFileName(null);
    }
  }, [householdId, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 260, damping: 24 }}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={`w-full cursor-pointer rounded-2xl border-2 border-dashed p-6 text-left transition-colors flex flex-col gap-4 items-center justify-center min-h-[160px] ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        } ${uploading ? 'opacity-60' : ''}`}
      >
        {uploading ? (
          <>
            <FileText className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Uploading {fileName}...</span>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Add a book</p>
              <p className="text-xs text-muted-foreground mt-1">Drop a PDF or tap to browse</p>
            </div>
          </>
        )}
      </button>
    </motion.div>
  );
};
```

- [ ] **Step 3: Replace mode-selector with home-page**

Rename `client/app/h/[householdId]/mode-selector.tsx` to `client/app/h/[householdId]/home-page.tsx` and replace contents:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Settings } from 'lucide-react';
import { KidCard, UploadCard } from '@/components/HomeCard';
import { SignOutButton } from '@/components/SignOutButton';

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  coverUrl: string | null;
  progress: number;
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
  kids: Kid[];
  hasBooks: boolean;
}

export const HomePage = ({ householdId, kids, hasBooks }: HomePageProps) => {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">EmberTales</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Kid avatars — tap to go to their book library */}
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => router.push(`/h/${householdId}/kid/${kid.id}`)}
                  title={`${kid.name}'s books`}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110"
                  style={{ backgroundColor: kid.color ?? '#60A5FA' }}
                >
                  {kid.avatar ?? kid.name[0]?.toUpperCase()}
                </button>
              ))}

              {/* Settings cog — parent dashboard */}
              <button
                onClick={() => router.push(`/h/${householdId}/dashboard`)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Card strip */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {kids.map((kid, i) => (
            <KidCard
              key={kid.id}
              householdId={householdId}
              kid={kid}
              lastBook={kid.lastBook}
              hasBooks={hasBooks}
              index={i}
            />
          ))}
          <UploadCard householdId={householdId} index={kids.length} />
        </div>

        {kids.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            No readers yet. <button onClick={() => router.push(`/h/${householdId}/dashboard`)} className="underline hover:text-foreground">Add one from settings.</button>
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Stories, read together
        </div>
      </footer>
    </div>
  );
};
```

- [ ] **Step 4: Delete old mode-selector.tsx**

```bash
rm client/app/h/\[householdId\]/mode-selector.tsx
```

- [ ] **Step 5: Verify the home page renders**

```bash
cd client && pnpm dev
```

Navigate to `/h/{householdId}`. Expect: card strip with kid cards + upload card. Verify:
- Kid cards show name, color, and progress info (or "Browse books")
- Upload card opens file picker on click
- Header avatars navigate to kid book library
- Settings cog navigates to dashboard

- [ ] **Step 6: Commit**

```bash
git add client/app/h/\[householdId\]/page.tsx client/app/h/\[householdId\]/home-page.tsx client/components/HomeCard.tsx
git rm client/app/h/\[householdId\]/mode-selector.tsx
git commit -m "feat: replace Mode Selector with card strip home page

Kid cards show last-read book with Continue/Browse action.
Upload card has inline file picker. Header has kid avatars + settings cog."
```

---

## Task 4: Edit/Delete Kid Dialog

**Files:**
- Create: `client/components/EditKidDialog.tsx`
- Modify: `client/components/KidSelector.tsx`

**Context:** Reuse the visual pattern from `AddKidDialog.tsx` (name input, color picker, preview). Add a "Remove" section at the bottom with confirmation. KidSelector gets a pencil icon on hover to open the edit dialog. Backend PATCH/DELETE must be done first (Task 2).

- [ ] **Step 1: Create EditKidDialog**

Create `client/components/EditKidDialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

const COLOR_OPTIONS = [
  '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C',
];

interface EditKidDialogProps {
  kid: { id: string; name: string; color: string | null };
  open: boolean;
  onClose: () => void;
}

export const EditKidDialog = ({ kid, open, onClose }: EditKidDialogProps) => {
  const [name, setName] = useState(kid.name);
  const [color, setColor] = useState(kid.color ?? COLOR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  if (!open) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/kids/${kid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Updated!' });
      router.refresh();
      onClose();
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/kids/${kid.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: `${kid.name} removed` });
      router.refresh();
      onClose();
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' });
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
        <h2 className="text-lg font-display font-bold mb-4">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        {/* Delete section */}
        <div className="mt-6 pt-4 border-t border-border">
          {showDeleteConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Remove {kid.name}? This deletes their reading progress.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground"
                >
                  Keep
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-destructive hover:underline"
            >
              Remove profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Add edit affordance to KidSelector**

In `client/components/KidSelector.tsx`, add a pencil icon overlay on hover and an `onEditKid` callback prop:

```tsx
'use client';

import { Plus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface KidSelectorProps {
  kids: Kid[];
  selectedKidId?: string;
  onSelectKid: (kidId: string) => void;
  onAddKid?: () => void;
  onEditKid?: (kid: Kid) => void;
}

export const KidSelector = ({ kids, selectedKidId, onSelectKid, onAddKid, onEditKid }: KidSelectorProps) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {kids.map((kid) => (
        <motion.div
          key={kid.id}
          className="flex flex-col items-center gap-2 min-w-fit relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => onSelectKid(kid.id)}
            className="relative"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-colors ${
                selectedKidId === kid.id ? 'border-primary shadow-lg' : 'border-transparent'
              }`}
              style={{ backgroundColor: kid.color ?? '#60A5FA' }}
            >
              <span className="text-2xl font-display text-white">
                {kid.avatar ?? kid.name[0]?.toUpperCase()}
              </span>
            </div>
          </button>

          {/* Edit icon — appears on hover */}
          {onEditKid && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditKid(kid); }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
          )}

          <span className={`text-sm font-medium transition-colors ${
            selectedKidId === kid.id ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {kid.name}
          </span>
        </motion.div>
      ))}

      {onAddKid && (
        <div className="flex flex-col items-center gap-2 min-w-fit">
          <button
            onClick={onAddKid}
            className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Add</span>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Wire EditKidDialog into dashboard**

In `client/app/h/[householdId]/dashboard/dashboard-client.tsx`, add state for edit dialog and pass `onEditKid` to KidSelector:

```tsx
// Add imports at top:
import { EditKidDialog } from '@/components/EditKidDialog';

// Add state inside ParentDashboardClient:
const [editingKid, setEditingKid] = useState<Kid | null>(null);

// Update KidSelector usage:
<KidSelector
  kids={kids}
  selectedKidId={selectedKidId}
  onSelectKid={setSelectedKidId}
  onAddKid={handleAddKid}
  onEditKid={(kid) => setEditingKid(kid)}
/>

// Add dialog next to AddKidDialog at bottom of component:
{editingKid && (
  <EditKidDialog
    kid={editingKid}
    open={!!editingKid}
    onClose={() => setEditingKid(null)}
  />
)}
```

- [ ] **Step 4: Verify edit/delete works**

Start both server and client. On the dashboard, hover a kid avatar — pencil should appear. Click it, edit name, save. Verify name updates. Test delete with confirmation.

- [ ] **Step 5: Commit**

```bash
git add client/components/EditKidDialog.tsx client/components/KidSelector.tsx client/app/h/\[householdId\]/dashboard/dashboard-client.tsx
git commit -m "feat: add edit/delete kid profile via EditKidDialog"
```

---

## Task 5: Merge Upload into Library Tab

**Files:**
- Modify: `client/app/h/[householdId]/dashboard/dashboard-client.tsx`

**Context:** Remove the "Upload" tab from the dashboard. Place the `BookUpload` component at the top of the Library tab, collapsed into a compact drop zone. This reduces tabs from 3 to 2 (Library, Progress).

- [ ] **Step 1: Remove Upload tab, add upload zone to Library**

In `client/app/h/[householdId]/dashboard/dashboard-client.tsx`:

1. Remove `'upload'` from the `Tab` type: `type Tab = 'library' | 'progress';`
2. Remove the upload entry from the `tabs` array
3. Remove the `activeTab === 'upload'` block from AnimatePresence
4. Add `<BookUpload>` at the top of the library tab content:

```tsx
{activeTab === 'library' && (
  <motion.div
    key="library"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="space-y-6"
  >
    {/* Upload zone at top of library */}
    <div className="max-w-2xl">
      <BookUpload householdId={householdId} />
    </div>

    {/* Book grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={{
            id: book.id,
            title: book.title,
            author: book.author,
            status: book.status,
            coverImageUrl: book.cover_image_url,
          }}
          variant="parent"
          onDelete={handleDeleteBook}
        />
      ))}
      {books.length === 0 && (
        <p className="col-span-full text-center text-muted-foreground py-8">
          No books yet. Drop a PDF above to get started.
        </p>
      )}
    </div>
  </motion.div>
)}
```

- [ ] **Step 2: Verify**

Open dashboard → Library tab. Upload zone should appear at top, books below. Drag a PDF — upload works. The tab bar should show only Library and Progress.

- [ ] **Step 3: Commit**

```bash
git add client/app/h/\[householdId\]/dashboard/dashboard-client.tsx
git commit -m "feat: merge Upload tab into Library — upload zone at top of book grid"
```

---

## Task 6: Empty States and Language Cleanup

**Files:**
- Modify: `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx`
- Modify: `client/app/h/[householdId]/dashboard/dashboard-client.tsx`

**Context:** Replace plain-text empty states with EmberDragon illustration + actionable text. Clean up baby language to be warm-but-neutral across all pages. Tone guide: think Miyazaki — treats kids as capable people.

- [ ] **Step 1: Update Kid Home empty state**

In `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx`, replace the empty books message:

```tsx
// Replace the existing empty state:
{books.length === 0 && (
  <p className="col-span-full text-center text-muted-foreground py-8">
    No books yet! Ask a parent to add some.
  </p>
)}

// With:
{books.length === 0 && (
  <div className="col-span-full flex flex-col items-center py-12 gap-4">
    <EmberDragon size="sm" />
    <p className="text-center text-muted-foreground text-lg">
      No books here yet
    </p>
  </div>
)}
```

- [ ] **Step 2: Update Kid Home hero text**

In the same file, change the hero subtitle from "Ready for a reading adventure?" to "Ready to read?":

```tsx
// Replace:
<Sparkles className="w-5 h-5 text-accent" />
Ready for a reading adventure?

// With:
<Sparkles className="w-5 h-5 text-accent" />
Ready to read?
```

- [ ] **Step 3: Update dashboard empty library text**

Already addressed in Task 5 — verify the empty state says "No books yet. Drop a PDF above to get started." (not "Upload one to get started!").

- [ ] **Step 4: Commit**

```bash
git add client/app/h/\[householdId\]/kid/\[kidId\]/kid-home-client.tsx
git commit -m "fix: improve empty states and tone — warm but not childish"
```

---

## Agent Dispatch Strategy

These tasks can be parallelized as follows:

| Agent | Tasks | Dependencies | Notes |
|-------|-------|-------------|-------|
| Agent A | Task 1 (font fix) | None | Small, fast. Do first to unblock visual QA. |
| Agent B | Task 2 (backend endpoints) | None | Independent. Python only. |
| Agent C | Task 3 (home page) | Task 1 ideally done first | The big feature. Needs fonts working to verify. |
| Agent D | Task 4 (edit/delete kid) | Task 2 must be done | Needs PATCH/DELETE endpoints. |
| Agent E | Task 5 + 6 (merge upload + empty states) | None | Small edits, can batch together. |

**Recommended execution order:**
1. Launch Agent A (font fix) + Agent B (backend) in parallel
2. Launch Agent C (home page) + Agent E (upload merge + empty states) in parallel
3. Launch Agent D (edit kid dialog) after Agent B completes
