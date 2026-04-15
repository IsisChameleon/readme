# Component Styling Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update 4 real app components to visually match the Enchanted Forest design system in `/admin/design`, preserving all existing features.

**Architecture:** Each component gets its Tailwind classes updated to match the design system tokens (Marcellus font, correct border-radius, spacing, colors). Design page mockups are updated where the real component has features the mockup doesn't show. No structural/logic changes.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Framer Motion, Lucide icons

**Spec:** `docs/superpowers/specs/2026-04-09-component-styling-alignment.md`

---

### Design System Quick Reference (from /admin/design)

These rules apply to ALL tasks below:

- **Headings/buttons/kid UI font:** `font-[family-name:var(--font-marcellus)]`
- **Body text font:** default (Nunito via `font-sans`)
- **Kid-facing cards:** `rounded-2xl`, generous padding (p-6, gap-6), larger text
- **Parent UI:** `rounded-xl`, tighter padding (p-4, gap-4)
- **Cards:** `border border-border bg-card`, no shadows (use border for elevation)
- **Interactive cards hover:** `hover:border-primary hover:scale-[1.02] transition-all`
- **Inputs:** `rounded-xl border border-input bg-background`
- **Buttons:** `rounded-xl` (default), `rounded-2xl` (kid/large)
- **Focus:** `ring-2 ring-ring ring-offset-2`
- **Avatars:** `rounded-full`
- **Modal overlay:** `bg-black/50 backdrop-blur-sm`
- **Modal content:** `bg-card rounded-xl p-6 shadow-lg`

---

### Task 1: KidSelector

**Files:**
- Modify: `client/components/KidSelector.tsx`
- Modify: `client/app/admin/design/page.tsx` (KidSelector mockup section, ~line 572)

- [ ] **Step 1: Update KidSelector circle styling — selection state**

In `client/components/KidSelector.tsx`, change the avatar circle from `border-4` selection to `ring` selection. Replace lines 35-44:

```tsx
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                selectedKidId === kid.id
                  ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: kid.color ?? '#60A5FA' }}
            >
              <span className="text-2xl font-[family-name:var(--font-marcellus)] text-white">
                {kid.avatar ?? kid.name[0]?.toUpperCase()}
              </span>
            </div>
```

Key changes:
- `border-4 border-primary shadow-lg` → `ring-2 ring-ring ring-offset-2 ring-offset-background`
- `border-transparent` → `opacity-70 hover:opacity-100`
- `font-display` → `font-[family-name:var(--font-marcellus)]`

- [ ] **Step 2: Update KidSelector name styling**

Replace lines 57-61:

```tsx
          <span className={`text-sm transition-colors ${
            selectedKidId === kid.id ? 'font-semibold text-foreground' : 'text-muted-foreground'
          }`}>
            {kid.name}
          </span>
```

Key changes:
- Selected: `text-primary` → `font-semibold text-foreground` (matches design mockup)
- `font-medium` removed from unselected (just `text-muted-foreground`)

- [ ] **Step 3: Update KidSelector add button**

Replace lines 67-72:

```tsx
          <button
            onClick={onAddKid}
            className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
          </button>
```

Key change: add `hover:bg-primary/5` for subtle hover feedback.

- [ ] **Step 4: Update design page KidSelector mockup to show edit icon**

In `client/app/admin/design/page.tsx`, find the KidSelector section (~line 572). After the kid circles mapping, add a note about the edit icon:

Find:
```tsx
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Used in:</strong> Dashboard (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/dashboard</code>) — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">components/KidSelector.tsx</code>
                </p>
```

After it, add:
```tsx
                <p className="text-xs text-muted-foreground mb-4 italic">Note: Real component shows a pencil edit icon on hover over each kid circle.</p>
```

- [ ] **Step 5: Verify visually and commit**

Run: `open http://localhost:3000/admin/design` — check KidSelector mockup.
Navigate to the home page and then dashboard to verify the real KidSelector.

```bash
git add client/components/KidSelector.tsx client/app/admin/design/page.tsx
git commit -m "style: align KidSelector to Enchanted Forest design system"
```

---

### Task 2: KidCard + UploadCard

**Files:**
- Modify: `client/components/HomeCard.tsx`

- [ ] **Step 1: Update KidCard accent stripe and avatar**

In `client/components/HomeCard.tsx`, update the KidCard component (lines 55-77).

Replace the card container className (line 63):
```tsx
      className="w-full cursor-pointer rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:scale-[1.02] flex flex-col gap-4 relative overflow-hidden"
```

Key changes:
- Remove `shadow-sm transition-shadow hover:shadow-lg` → use `transition-all hover:border-primary hover:scale-[1.02]` (design says borders not shadows)

Replace the accent stripe (line 66):
```tsx
      <div className="absolute top-0 left-0 w-full h-3 rounded-t-2xl" style={{ backgroundColor: color }} />
```

Key change: `h-1.5` → `h-3` (thicker stripe per mockup).

Replace the avatar section (lines 69-77):
```tsx
      {/* Kid identity */}
      <div className="flex items-center gap-4 pt-2">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
          style={{ backgroundColor: `${color}33`, color }}
        >
          {kid.avatar ?? kid.name[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-marcellus)] text-xl font-bold text-foreground">{kid.name}</h3>
          <p className="text-sm text-muted-foreground">
            {isResuming ? 'Reading now' : singleBook ? 'Ready to read' : readyBooks.length > 0 ? `${readyBooks.length} books` : 'No books yet'}
          </p>
        </div>
      </div>
```

Key changes:
- `w-12 h-12` → `w-16 h-16` (larger avatar)
- Solid color background → semi-transparent (`${color}33` = 20% opacity hex) with colored text
- `span` → `div` wrapper with name + subtitle
- `font-display` → `font-[family-name:var(--font-marcellus)]`
- `gap-3` → `gap-4`

- [ ] **Step 2: Update KidCard book info section**

Replace the book info section (lines 80-120) — wrap in a secondary container when there's book content:

```tsx
      {/* Book info */}
      {isResuming ? (
        <div className="rounded-xl bg-secondary/50 p-3 space-y-2">
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
      ) : singleBook ? (
        <div className="rounded-xl bg-secondary/50 p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="truncate">{singleBook.title}</span>
          </div>
          {singleBook.author && singleBook.author !== 'Unknown' && (
            <p className="text-xs text-muted-foreground pl-6">by {singleBook.author}</p>
          )}
          <span className="inline-block text-sm font-semibold mt-1" style={{ color }}>
            Start reading &rarr;
          </span>
        </div>
      ) : readyBooks.length > 0 ? (
        <div>
          <span className="text-sm text-muted-foreground">
            {lastBook?.progress === 100 ? 'Finished! Pick another' : `${readyBooks.length} books`}
          </span>
          <span className="block text-sm font-semibold mt-1" style={{ color }}>
            Browse &rarr;
          </span>
        </div>
      ) : null}
```

Key change: book info wrapped in `rounded-xl bg-secondary/50 p-3` container (matching mockup). Empty state removed (already shown in subtitle).

- [ ] **Step 3: Update UploadCard styling**

In `client/components/HomeCard.tsx`, update the UploadCard (lines 178-210).

Replace the non-uploading content (lines 201-207):
```tsx
          <>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Upload className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-[family-name:var(--font-marcellus)] font-semibold text-foreground">Add a Book</p>
              <p className="text-sm text-muted-foreground mt-1">Drop PDF or click to browse</p>
            </div>
          </>
```

Key changes:
- Upload icon: wrap in `h-14 w-14 rounded-full bg-primary/10` circle, color `text-primary`
- Title: add `font-[family-name:var(--font-marcellus)]`
- Subtitle wording: "Drop a PDF or tap to browse" → "Drop PDF or click to browse"

- [ ] **Step 4: Verify visually and commit**

Navigate to home page to verify KidCard and UploadCard.

```bash
git add client/components/HomeCard.tsx
git commit -m "style: align KidCard and UploadCard to Enchanted Forest design system"
```

---

### Task 3: EditKidDialog + AddKidDialog

**Files:**
- Modify: `client/components/EditKidDialog.tsx`
- Modify: `client/components/AddKidDialog.tsx`

- [ ] **Step 1: Update EditKidDialog modal styling**

In `client/components/EditKidDialog.tsx`:

Replace overlay (line 69):
```tsx
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
```

Replace dialog container (lines 70-73):
```tsx
      <div
        className="relative bg-card rounded-xl p-6 w-full max-w-sm mx-4 border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
```

Replace title (line 74):
```tsx
        <h2 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-4">Edit Profile</h2>
```

Key changes:
- Overlay: add `backdrop-blur-sm`
- Container: `rounded-2xl` → `rounded-xl`, add `shadow-lg` and `relative`
- Title: `text-lg font-display` → `font-[family-name:var(--font-marcellus)] text-xl`

- [ ] **Step 2: Update EditKidDialog inputs and buttons**

Replace input (line 82):
```tsx
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none"
```

Replace Cancel button (lines 117-122):
```tsx
            <button
              type="button"
              onClick={onClose}
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
```

Replace Save button (lines 124-130):
```tsx
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
```

Replace destructive Remove button (lines 148-152):
```tsx
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="font-[family-name:var(--font-marcellus)] px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50"
                >
                  Remove
                </button>
```

Key changes across all:
- `rounded-lg` → `rounded-xl` on inputs and buttons
- Add `font-[family-name:var(--font-marcellus)]` to buttons
- Add `hover:bg-secondary transition-colors` to Cancel
- Add `hover:bg-primary/90 transition-colors` and `disabled:cursor-not-allowed` to Save
- Add focus ring to input

- [ ] **Step 3: Update AddKidDialog — same pattern as EditKidDialog**

In `client/components/AddKidDialog.tsx`:

Replace overlay (line 54):
```tsx
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
```

Replace dialog container (lines 55-57):
```tsx
      <div
        className="relative bg-card rounded-xl p-6 w-full max-w-sm mx-4 border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
```

Add close button after the opening `<div>`, before `<h2>`:
```tsx
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
```

Add `X` to the imports:
```tsx
import { X } from 'lucide-react';
```

Replace title (line 59):
```tsx
        <h2 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-4">Add a Reader</h2>
```

Replace input (line 67):
```tsx
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none"
```

Replace Cancel button (lines 100-104):
```tsx
            <button
              type="button"
              onClick={onClose}
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
```

Replace Add button (lines 107-113):
```tsx
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {submitting ? 'Adding…' : 'Create'}
            </button>
```

Key changes: same as EditKidDialog, plus close button (X) in top-right per Modal/Dialog spec.

- [ ] **Step 4: Verify visually and commit**

Open home page, click Add or Edit a kid to verify dialog styling.

```bash
git add client/components/EditKidDialog.tsx client/components/AddKidDialog.tsx
git commit -m "style: align EditKidDialog and AddKidDialog to Enchanted Forest design system"
```

---

### Task 4: BookCard

**Files:**
- Modify: `client/components/BookCard.tsx`
- Modify: `client/app/admin/design/page.tsx` (BookCard parent mockup, ~line 530)

- [ ] **Step 1: Update BookCard kid variant container and cover**

In `client/components/BookCard.tsx`, replace the kid variant container (line 46):
```tsx
        className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden cursor-pointer touch-manipulation transition-all hover:border-primary hover:scale-[1.02]"
```

Key changes:
- Remove `gap-6 py-6 shadow-sm border-2 border-transparent duration-300 hover:shadow-xl`
- Add `border border-border hover:border-primary hover:scale-[1.02]` (design: borders not shadows)

- [ ] **Step 2: Update BookCard kid variant content section**

Replace the content section (lines 73-92):
```tsx
        {/* Content */}
        <div className="p-5">
          <h3 className="font-[family-name:var(--font-marcellus)] text-xl font-bold leading-tight line-clamp-2">{book.title}</h3>
          {book.author && (
            <p className="text-sm text-muted-foreground truncate mt-1">{book.author}</p>
          )}
          {progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {progress === 100 && (
            <div className="mt-2 inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
              Complete!
            </div>
          )}
          {book.status === 'ready' ? (
            <button
              className="mt-4 w-full h-14 rounded-2xl bg-accent text-accent-foreground font-[family-name:var(--font-marcellus)] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
              onClick={(e) => { e.stopPropagation(); onStartReading?.(book.id); }}
            >
              <Mic className="w-6 h-6" />
              {buttonLabel}
            </button>
          ) : (
            <span className="mt-2 block text-xs text-muted-foreground capitalize">
              {book.status}…
            </span>
          )}
        </div>
```

Key changes:
- Progress bar moved from cover overlay to content area with text label
- Completion badge: `bg-white/90 text-green-600` → `bg-primary/10 text-primary`
- CTA button: `bg-primary` → `bg-accent text-accent-foreground rounded-2xl` (kid CTA = amber per design)
- Button font: add `font-[family-name:var(--font-marcellus)]`
- Title font: `font-display` → `font-[family-name:var(--font-marcellus)]`
- `p-4 md:p-5` → `p-5`

- [ ] **Step 3: Remove progress overlay from cover**

Replace the cover section (lines 49-71) — remove the progress bar and completion badge that are now in the content area:

```tsx
        {/* Book cover */}
        <div
          className="relative h-44 md:h-52 flex items-center justify-center"
          style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
        >
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <BookOpen className="w-16 h-16 md:w-20 md:h-20 text-white/80" />
          )}
        </div>
```

Key change: removed the progress bar overlay and "Done!" badge from the cover (they're now in the content section from Step 2).

- [ ] **Step 4: Update BookCard parent variant styling**

Replace the parent container (line 173):
```tsx
    <div className="flex rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors">
```

Replace the title (line 217):
```tsx
                  <h3 className="font-[family-name:var(--font-marcellus)] font-semibold text-foreground truncate">{book.title}</h3>
```

Replace the menu button (lines 224-228):
```tsx
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
```

Key changes:
- Container: add `hover:border-primary transition-colors`
- Title: add `font-[family-name:var(--font-marcellus)]`
- Menu button: `p-2 rounded-lg hover:bg-muted` → `h-8 w-8 rounded-lg bg-secondary` (per design system icon button spec)

- [ ] **Step 5: Update design page BookCard parent mockup to show dropdown menu**

In `client/app/admin/design/page.tsx`, find the BookCard parent variant section (~line 530). After the existing "Used in" paragraph, add a note:

```tsx
                <p className="text-xs text-muted-foreground mb-3 italic">Note: Real parent variant includes a dropdown menu (Edit, Delete) via MoreVertical icon button.</p>
```

- [ ] **Step 6: Verify visually and commit**

Navigate to dashboard (parent variant) and kid home (kid variant) to verify BookCard.

```bash
git add client/components/BookCard.tsx client/app/admin/design/page.tsx
git commit -m "style: align BookCard to Enchanted Forest design system"
```
