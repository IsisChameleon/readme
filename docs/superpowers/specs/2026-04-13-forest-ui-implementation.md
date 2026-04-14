# Forest UI Implementation — Spec

**Date:** 2026-04-13
**Branch:** `forest-ui`
**Scope:** Migrate the real app (home, library, readers, kid home) to the approved wireframes in `/admin/design/*`. Add a component-snapshot test harness documented for review.

---

## 1. Goal

The wireframes in `/admin/design/{overview,visual,primitives,headers,components,pages}` are the source of truth. This spec locks the production app to them: same anatomy, same tokens, same nav, same component variants.

All structural decisions are already approved. This document captures them precisely; the companion implementation plan (`docs/superpowers/plans/2026-04-13-forest-ui-implementation.md`) executes them task-by-task with snapshot tests.

## 2. Design decisions (approved in prior brainstorming)

### 2.1 Routing

- Split `/h/[householdId]/dashboard` (tabbed Library + Readers) into two independent routes:
  - `/h/[householdId]/library` — household books, upload affordance, parent `BookCard`
  - `/h/[householdId]/readers` — one panel per kid with `ReaderBookRow`s, "Add reader" CTA
- `/h/[householdId]/dashboard` → **redirect** to `/h/[householdId]/library` (preserve external links, in-app links migrate)
- No new tab UI anywhere; each surface stands alone.

### 2.2 `AppHeader`

- Taller layout (drop `h-16` single-row). Approximately `py-4`.
- Left cluster: `EmberLogo size={40}` + `text-2xl font-bold` wordmark + subtitle `text-sm text-muted-foreground` — defaulting to `"Stories, read together"`.
- No `center` slot (no tabs, no kid circles).
- `right` slot optional (`ProfileAvatar` or nothing).
- `backHref` optional (shown as arrow button).
- Remove the mobile below-header `center` rail.
- **Props:** `{ backHref?: string; right?: ReactNode; subtitle?: string; hideWordmarkSm?: boolean }`. Remove `center`.

### 2.3 `ProfileAvatar`

- **Click-only.** Remove the hover tooltip that duplicates the popover (`title` attribute fine; the absolute hover div is deleted).
- Popover items (top to bottom):
  1. Library → `/h/{householdId}/library` (icon: `BookOpen`)
  2. Manage readers → `/h/{householdId}/readers` (icon: `Users`)
  3. Divider
  4. Sign out (icon: `LogOut`)
  5. Delete account (icon: `Trash2`, destructive color) — keep current TODO stub
- Page-aware: pass current path; if a menu target matches the current surface, render that row in italic `text-muted-foreground` with label `"Currently viewing"` suffix. No click handler on the collapsed row.
- **Props change:** drop `manageHref`; add `householdId: string` and `currentPath?: string`.

### 2.4 Home page (`/h/[householdId]`)

- `AppHeader` right slot = `ProfileAvatar` only. No kid circles.
- Remove bottom `<footer>` with "Stories, read together" (the line lives in the header subtitle now).
- Strip body unchanged structurally: `KidCard` per kid + trailing `UploadCard`. (Those are the Strip Companion cards — they already match the approved skeleton per 2026-04-09 work.)
- Empty state (no kids) now routes to `/readers` (previously `/dashboard`).

### 2.5 Library page (`/h/[householdId]/library`) — **new**

- Server component fetches `kids` + `books` (+ per-kid progress) — identical data shape to current `dashboard/page.tsx`.
- Client component renders:
  - `AppHeader` with `backHref=/h/{householdId}` + `right=ProfileAvatar(currentPath=library)`
  - Compact `BookUpload` row
  - Vertical list of `BookCard variant="parent"` + per-kid progress strip.

### 2.6 Readers page (`/h/[householdId]/readers`) — **new**

- Server component fetches `kids` + `books` (+ per-kid progress) — identical data shape to current `dashboard/page.tsx`.
- Client renders:
  - `AppHeader` with `backHref=/h/{householdId}` + `right=ProfileAvatar(currentPath=readers)`
  - One `ReaderPanel` per kid (card with avatar, name, "N books · Last active X", list of `ReaderBookRow`, "Edit" cog)
  - Trailing "Add a reader" dashed CTA
- Reuses `AddKidDialog` + `EditKidDialog` as-is.

### 2.7 Kid home (`/h/[householdId]/kid/[kidId]`)

- `AppHeader` with `backHref` only (no right slot — kid surface, no parent menu).
- Greeting block unchanged.
- Grid of `BookCard variant="kid"` using the harmonized `h-44` hero (see 2.9).

### 2.8 `HomeCard` (`KidCard` + `UploadCard`)

- Already rewritten to Strip Companion anatomy per prior work (populated variant, empty variant, upload variant).
- No changes this spec — verify via snapshot that output matches the `/admin/design/components` mockup.

### 2.9 `BookCard` — both variants

**Kid variant:** drop `aspect-[2/3]` cover (line 51). Replace with `relative h-44 overflow-hidden` hero that contains:
- Cover image or `BookOpen` icon on `coverColor` fallback.
- Gradient overlay `bg-gradient-to-t from-black/70 via-black/10 to-transparent`.
- Title overlay `absolute bottom-3 left-4 right-4` in Marcellus `text-lg font-bold text-white drop-shadow line-clamp-2`, author line under in `text-xs text-white/80`.

Body keeps progress bar (`h-1.5 bg-muted` + primary fill, caption `text-xs text-muted-foreground`) and amber `Continue`/`Start Reading` CTA.

**Parent variant:** replace the current single aggregate progress bar with the per-kid dots pattern:
- Cover `w-16 h-24` (smaller than current `w-24 h-32`) to keep the card compact.
- Body: title + author + status, dropdown menu unchanged.
- Instead of a single `h-2 bg-muted` bar, render **one row per kid with progress**:
  - Kid-colored dot `h-2.5 w-2.5 rounded-full`
  - Kid name `text-xs text-muted-foreground` fixed-width `w-12 truncate`
  - `flex-1 h-1.5 rounded-full bg-muted` track with kid-colored fill
  - `%` label `text-xs text-muted-foreground w-8 text-right`
- This requires passing `kidProgress: Array<{ kidId, kidName, kidColor, progress }>` to the parent variant. Callers already have the data.

### 2.10 `ReaderBookRow` — **new component**

`client/components/ReaderBookRow.tsx`. Exact anatomy per `/admin/design/components`:

```
<div class="rounded-lg bg-secondary/60 px-3 py-2">
  <div class="flex justify-between text-sm mb-1">
    <span class="truncate text-foreground">{title}</span>
    <span class="text-xs text-muted-foreground ml-2">{progress}%</span>
  </div>
  <div class="h-1.5 rounded-full bg-muted overflow-hidden">
    <div class="h-full rounded-full" style={{ width, backgroundColor: kidColor }} />
  </div>
</div>
```

Props: `{ title: string; progress: number; kidColor: string }`.

### 2.11 `KidSelector` — **remove**

Not used anywhere outside its own definition (grep confirmed). Delete `components/KidSelector.tsx` and the corresponding `/admin/design/components` section was already removed.

### 2.12 Absent from scope

- AnimatedOrb rework — separate future plan.
- Visual polish to `EditKidDialog` / `AddKidDialog` / `BookUpload` — unchanged.
- Route restructuring of `/admin/design` itself — already done in a prior plan.
- Dark-mode audit — inherited from tokens.

## 3. Testing strategy

The repo currently has **no test framework**. Part of this work adds a minimal one and uses it only for component snapshot coverage of the wireframe-approved components.

- **Runner:** Vitest (native TS + esbuild, works with Next.js app router client components, fastest install).
- **DOM:** `@testing-library/react` + `jsdom`.
- **Snapshots:** inline `toMatchSnapshot()` against the rendered HTML of each component at representative prop combinations. Snapshots are committed — the user reviews the generated `__snapshots__/*.snap` file as a stand-in for visual approval.
- **Scope:** component-level only (`AppHeader`, `ProfileAvatar`, `HomeCard`, `BookCard`, `ReaderBookRow`). No page-level or route tests. No e2e. No Storybook.
- **What goes in each snapshot:** a fixed set of prop cases (see plan). Data is static — no real Supabase, no real API.

### Why snapshots and not behavioral tests

The goal the user stated was "tested with snapshot documented for review." The review artefact is the `.snap` file — if the HTML diffs, the reviewer sees exactly which tokens/classes changed. Behavioral assertions are out of scope; those can be layered on later per-component.

## 4. File inventory

### Create

- `client/components/ReaderBookRow.tsx`
- `client/app/h/[householdId]/library/page.tsx` (server)
- `client/app/h/[householdId]/library/library-client.tsx` (client)
- `client/app/h/[householdId]/library/loading.tsx`
- `client/app/h/[householdId]/library/error.tsx`
- `client/app/h/[householdId]/readers/page.tsx` (server)
- `client/app/h/[householdId]/readers/readers-client.tsx` (client)
- `client/app/h/[householdId]/readers/loading.tsx`
- `client/app/h/[householdId]/readers/error.tsx`
- `client/vitest.config.ts`
- `client/vitest.setup.ts`
- `client/components/__tests__/AppHeader.test.tsx`
- `client/components/__tests__/ProfileAvatar.test.tsx`
- `client/components/__tests__/HomeCard.test.tsx`
- `client/components/__tests__/BookCard.test.tsx`
- `client/components/__tests__/ReaderBookRow.test.tsx`

### Modify

- `client/components/AppHeader.tsx` — taller layout, subtitle, drop `center`.
- `client/components/ProfileAvatar.tsx` — drop hover tooltip; split menu; page-aware collapse.
- `client/components/BookCard.tsx` — kid hero `h-44`, parent per-kid progress rows.
- `client/app/h/[householdId]/home-page.tsx` — drop kid circles; drop footer.
- `client/app/h/[householdId]/kid/[kidId]/kid-home-client.tsx` — `AppHeader` stays, no right slot.
- `client/app/h/[householdId]/dashboard/page.tsx` — turn into `redirect('/library')`.
- `client/package.json` — add Vitest + testing-library dev deps; add `test`, `test:update` scripts; update `github-checks` to include `vitest --run`.
- `client/app/admin/design/components/page.tsx` — update BookCard Parent mockup to show the new per-kid progress rows (if it drifts from real).

### Delete

- `client/components/KidSelector.tsx`
- `client/app/h/[householdId]/dashboard/dashboard-client.tsx` (replaced by two routes)
- `client/app/h/[householdId]/dashboard/loading.tsx`
- `client/app/h/[householdId]/dashboard/error.tsx`

(`page.tsx` under `dashboard` stays but becomes a single-line redirect.)

## 5. Verification

- `pnpm lint` — 0 errors.
- `pnpm typecheck` — 0 errors.
- `pnpm test` — 0 failures, all snapshots committed.
- Manual: `/h/$me`, `/h/$me/library`, `/h/$me/readers`, `/h/$me/kid/$kid` render correctly against the mockup in `/admin/design/pages`.
- Manual: the `/dashboard` URL redirects to `/library`.
- Manual: ProfileAvatar popover opens on click, collapses the current-surface row when on `/library` or `/readers`.
