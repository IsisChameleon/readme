# Component Styling Alignment to Enchanted Forest Design System

**Date:** 2026-04-09
**Scope:** Update real app components to match `/admin/design` visual language while preserving all existing features.

## Goal

Each real component should visually match its mockup in the design page. The design page mockups stay as mockups (not replaced with real imports) but are updated to reflect any structural/feature differences in the real components.

## Design System Rules (from /admin/design)

These rules from the Visual Language + Implementation tabs apply across ALL components:

### Typography
- **Headings/buttons/kid UI:** `font-[family-name:var(--font-marcellus)]`
- **Body text:** `font-sans` (Nunito via CSS)

### Border Radius
- `rounded-lg` — inputs, small buttons (8px)
- `rounded-xl` — cards, modals, parent UI (12px)
- `rounded-2xl` — kid-facing cards, playful elements (16px)
- `rounded-full` — avatars, pills, icon buttons

### Surfaces
- Cards: solid white/dark with subtle borders, no heavy shadows
- Elevation via `border-border`, not shadows

### Interaction States
- Hover: `bg-primary/90` for buttons, `scale-[1.02]` for cards
- Active: `scale-[0.98]`
- Focus: `ring-2 ring-ring ring-offset-2`
- Disabled: `opacity-50 cursor-not-allowed`

### Motion
- Default: `duration-200 ease-out`
- Page transitions: `duration-300`
- Dragon/playful: spring physics (Framer Motion)

### Kid vs Parent Density
- **Kid UI:** larger targets (48px min), generous padding (p-6, gap-6), bigger text (text-lg base), `rounded-2xl`, Marcellus headings
- **Parent UI:** standard targets (40px), tighter padding (p-4, gap-4), regular text, `rounded-xl`, Nunito body

### Button CVA (from Implementation tab)
- Variants: default, outline, secondary, ghost, destructive, **accent** (kid CTAs)
- Sizes: sm (`h-8 rounded-lg`), default (`h-10 rounded-xl`), lg (`h-14 rounded-2xl` kid-sized), icon (`h-10 w-10 rounded-xl`)

---

## Component Changes

### 1. KidSelector (`components/KidSelector.tsx`, 78 lines)

**Current:** `border-4` for selection, `border-transparent` for unselected, edit icons on hover

**Target (from design mockup):**
- Selected: `ring-2 ring-ring ring-offset-2` instead of `border-4`
- Unselected: `opacity-70 hover:opacity-100` instead of invisible border
- Name uses Marcellus: `font-[family-name:var(--font-marcellus)]` for selected
- Keep edit icons on hover (feature not in mockup but needed)

**Design page mockup update:** Add edit icon on hover to match real component.

### 2. KidCard + UploadCard (`components/HomeCard.tsx`, 213 lines)

**KidCard current:** `w-12 h-12` avatar, solid color, `h-1.5` accent stripe, compact layout

**KidCard target (from design mockup):**
- Avatar: `h-16 w-16` with semi-transparent background (`bg-[kidColor]/20`) instead of solid
- Accent stripe: `h-3` (thicker) at top
- Kid name: `font-[family-name:var(--font-marcellus)] text-xl font-bold`
- Book info wrapped in secondary container: `rounded-xl bg-secondary/50 p-3`
- Status text: `text-sm text-muted-foreground`

**UploadCard current:** mostly aligned already

**UploadCard target:**
- Icon container: `h-14 w-14 rounded-full bg-primary/10`
- Title: `font-[family-name:var(--font-marcellus)] font-semibold`
- Subtitle: `text-sm text-muted-foreground`

**Design page mockup update:** None needed, real component will match.

### 3. EditKidDialog + AddKidDialog (`components/EditKidDialog.tsx` 166 lines, `components/AddKidDialog.tsx` 120 lines)

**Current:** `rounded-2xl p-6`, `rounded-lg` inputs, `text-lg font-display` title

**Target (from Core Primitives modal spec):**
- Dialog: `bg-card rounded-xl p-6 shadow-lg` (change from rounded-2xl to rounded-xl per design system)
- Close button: `h-8 w-8 rounded-lg bg-secondary` positioned top-right (AddKidDialog doesn't have one — add it)
- Title: `font-[family-name:var(--font-marcellus)] text-xl font-bold`
- Inputs: `rounded-xl border border-input bg-background` (change from rounded-lg to rounded-xl)
- Buttons: Use Marcellus font, `rounded-xl` per button spec
- Color picker buttons: keep as-is (already `rounded-full`)
- Overlay: `bg-black/50 backdrop-blur-sm` (add backdrop-blur)

**Design page mockup update:** Add color picker and delete section to the Modal/Dialog mockup to reflect real dialog features.

### 4. BookCard (`components/BookCard.tsx`, 263 lines)

**Kid variant current:** `rounded-xl border-2 border-transparent`, progress overlay on cover, `h-44` cover

**Kid variant target (from design mockup):**
- Container: `rounded-2xl border border-border bg-card overflow-hidden` (kid-facing = rounded-2xl, visible border)
- Cover: keep as-is with gradient fallback
- Progress bar: move from cover overlay to content area below title, with text label (e.g. "75% complete")
- CTA button: accent variant — `rounded-2xl bg-accent text-accent-foreground` with Play icon + "Start Reading"
- Title: `font-[family-name:var(--font-marcellus)] text-xl font-bold`
- Author: `text-sm text-muted-foreground`

**Parent variant current:** horizontal layout with dropdown menu, single progress bar

**Parent variant target (from design mockup):**
- Container: `rounded-xl border border-border bg-card overflow-hidden` (parent = rounded-xl)
- Layout: keep horizontal, cover thumbnail on left
- Keep dropdown menu (feature in code, not in mockup)
- Settings icon button: `h-8 w-8 rounded-lg bg-secondary`
- Title/text: Marcellus for title, Nunito body

**Design page mockup update:** Add dropdown menu to parent variant mockup to reflect real component.

---

## What's NOT in scope

- **AnimatedOrb** — deferred, needs major visual rework
- **BookCard parent multi-kid progress** — feature addition, not styling
- **Page layout changes** — only component-level styling
- **Dark mode testing** — tokens already defined in globals.css, components inherit automatically
- **Button component refactor** — the existing `button.tsx` CVA structure may need updating to match the design system's CVA spec, but only if the components actually use it (check during implementation)

## Implementation Order

1. KidSelector (smallest, builds confidence)
2. KidCard + UploadCard (medium complexity)
3. EditKidDialog + AddKidDialog (nearly identical, batch together)
4. BookCard (most complex, two variants)

Each step: update real component → update design page mockup if needed → verify visually.
