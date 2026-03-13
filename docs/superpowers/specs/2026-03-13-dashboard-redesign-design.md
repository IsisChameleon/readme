# Dashboard Redesign Spec

## Context

The dashboard (`/dashboard`) is the parent-facing page for uploading and managing books. Kids use the `/call` page to pick books and read with the bot. The current dashboard has hardcoded inline styles, random accent colors on book cards, and an oversized MiniOrb that doesn't fit the page's purpose.

## Goals

1. Clean, modern parent dashboard with consistent dark lavender theme
2. Two-panel layout: orb hero (kid entry point) + library grid (parent management)
3. Responsive snap-scroll behavior for tablet and mobile
4. All styles use CSS custom properties — no hardcoded hex values in components
5. Upload card as first tile in the library grid

## Non-goals

- Per-child reading progress tracking (future feature)
- Book cover image upload/extraction (placeholder for now)
- Changes to the `/call` page or `VoiceSession`

## Layout

### Two-Panel Architecture

The page has two logical panels:

**Panel 1 — "Start Reading" (Orb Hero)**
- Centered plasma orb (real WebGL via `PlasmaOrb`, animated, not connected to a call)
- "Start Reading" label below the orb
- "Tap to talk with your reading buddy" subtitle
- Subtle radial glow behind the orb
- Tapping/clicking the orb navigates to `/call`

**Panel 2 — "Your Library" (Book Grid)**
- Header bar: logo (left), avatar + sign out (right)
- Section heading: "Your Library"
- Grid of cards: upload card first, then book cards
- Upload card: dashed border, "+" icon, "Upload PDF" label, supports drag-drop and click

### Responsive Behavior

| Viewport | Layout | Scroll | Grid Columns |
|----------|--------|--------|--------------|
| Desktop (>1024px) | Vertical stack | Normal scroll | 4 |
| Tablet landscape (768-1024px, landscape) | Horizontal panels | `scroll-snap-type: x mandatory` | 3 |
| Mobile/tablet portrait (<768px or portrait) | Vertical panels | `scroll-snap-type: y mandatory` | 2 |

On snap-scroll viewports, each panel takes 100vw/100vh so they feel like separate screens. On desktop, panels stack vertically with normal scrolling and the orb section takes ~40vh.

## Components

### `page.tsx` (Server Component)

Full rewrite. Fetches books from Supabase (unchanged query). Renders two-panel layout:
- Outer container with conditional snap-scroll (CSS handles this via media queries)
- Panel 1: `ReadingOrb` component
- Panel 2: header bar, `UploadCard`, mapped `BookCard` list

The `ACCENT_COLORS` array is removed — no more per-card color cycling.

**Note:** Upload card moves from last position to first in the grid (deliberate reorder).

### `ReadingOrb.tsx` (replaces `MiniOrb.tsx`)

Client component. `PlasmaOrb` dynamic import and `PlasmaErrorBoundary` are moved here from `MiniOrb.tsx` (inlined, not extracted — only one consumer). Changes:
- Centered layout (not fixed-position floating)
- "Start Reading" label and subtitle below the orb
- `Link` to `/call` wraps the orb
- Orb CSS display size: 100px on desktop, 120px on tablet/mobile. Plasma canvas renders at 2x (200/240) for retina.
- Subtle glow effect via CSS (`box-shadow` or pseudo-element radial gradient)

### `BookCard.tsx`

Props: `bookId`, `title`, `status`. Remove `accentColor` prop.

Structure:
- Cover area: gradient placeholder (consistent color), centered book emoji. Future: actual cover image.
- Text area: title (line-clamp-2), status indicator (small colored dot + text)
- Status dot colors: `--sage` for "ready", `--amber` for "processing", `--coral` for errors
- Consistent border, border-radius, and background from CSS variables
- Hover: subtle scale + shadow (keep framer-motion)

### `UploadCard.tsx`

Visual changes only — logic stays the same (drag-drop, file picker, upload via `apiClient`):
- Match book card dimensions
- Dashed border, "+" icon in a rounded square, "Upload PDF" label, "Drop file or click" subtitle
- Uploading state: spinner replaces "+" icon, "Uploading..." text
- All colors from CSS variables

### `SignOutButton.tsx`

Minor restyle — no logic changes:
- Text color: `var(--db-muted-fg)` instead of inline rgba
- Hover background: `var(--db-muted)` instead of hardcoded `#2a2040`

## Styling

### CSS Variables (extend `.dashboard-dark` in `globals.css`)

All component colors reference these variables. No inline hex values in TSX files.

```css
.dashboard-dark {
  /* Existing (unchanged) */
  --db-bg: #150f20;
  --db-card: #1e1730;
  --db-fg: #d4c8ee;
  --db-primary: #CAB8EB;
  --db-muted: #2a2040;

  /* Updated — opacity reduced from 0.6 to 0.45 for subtler muted text */
  --db-muted-fg: rgba(202, 184, 235, 0.45);

  /* Renamed: --db-border → --db-border (kept) for general use */
  --db-border: rgba(167, 139, 218, 0.25);

  /* New */
  --db-accent: #A78BDA;
  --db-card-border: rgba(167, 139, 218, 0.1);
  --db-glow: rgba(167, 139, 218, 0.12);
  --db-border-dashed: rgba(167, 139, 218, 0.25);
  --db-status-ready: var(--sage);
  --db-status-processing: var(--amber);
  --db-status-error: var(--coral);
}
```

### Snap Scroll CSS

```css
/* Tablet landscape */
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
  /* Library panel scrolls internally when books overflow */
  .dashboard-panel--library {
    overflow-y: auto;
  }
}

/* Mobile / tablet portrait */
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
  /* Library panel scrolls internally when books overflow */
  .dashboard-panel--library {
    overflow-y: auto;
    max-height: 100dvh;
  }
}
```

Desktop (>1024px) gets no snap-scroll — panels stack with normal flow.

**Grid columns:** `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (2 on mobile, 3 on tablet, 4 on desktop).

## File Changes Summary

| File | Action |
|------|--------|
| `app/dashboard/page.tsx` | Rewrite — two-panel layout |
| `components/ReadingOrb.tsx` | New — replaces MiniOrb.tsx |
| `components/MiniOrb.tsx` | Delete |
| `components/BookCard.tsx` | Simplify — remove accentColor, use CSS vars |
| `components/UploadCard.tsx` | Restyle — match card dimensions, CSS vars |
| `components/SignOutButton.tsx` | Minor — use CSS vars |
| `app/globals.css` | Extend `.dashboard-dark` variables, add snap-scroll classes |

## Testing

- Verify upload still works (drag-drop and click)
- Verify orb navigates to `/call`
- Check responsive behavior at: desktop (1280px), tablet landscape (1024x768), mobile portrait (390x844)
- Verify dark theme consistency — no stray hardcoded colors
- Verify book status indicators show correct colors
