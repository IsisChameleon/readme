# Readme -- UX Design

This document captures the agreed UX design for the MVP.

Wireframes (live/editable): https://excalidraw.com/#json=_IYNroLLviOHQOysjRs9b,bdUPado3KhsLBm0STvFjDw
Wireframes (source file): docs/ux-wireframes.excalidraw

---

## Design Language

**Style**: minimalist, hand-drawn artist marker aesthetic.
Every element should feel like it was sketched with a thin coloured or white marker.
Background surfaces carry faint line-art illustrations (open books, stars, crescent moons)
at low opacity -- decorative, never distracting.

| Token | Value | Use |
|---|---|---|
| Background (parent) | #FDFAF5 | Warm cream -- all parent screens |
| Background (child session) | #0d0d0f | Near-black -- makes orb pop |
| Coral | #F28B70 | Primary accent, book cards, CTAs |
| Sage | #7DBE9E | Secondary accent, success states |
| Lavender | #B8A9D9 | Orb accent, annotations |
| Amber | #F5C842 | Star decorations, highlights |
| Stroke | #1e1e1e | All borders and text |
| Muted | #868e96 | Secondary text, labels |

**Fonts**:
- Headings / brand: Caveat (Google Fonts, handwritten)
- Body / UI text: Nunito (Google Fonts, rounded friendly sans)

**Stroke style**: thin 1px, high roughness (sketchy feel). No drop shadows.
Cards use soft coloured borders matching their accent colour, not generic grey.

---

## Screens

### 1. Landing / Login

The only entry point. Parents authenticate here; children never see this screen directly.

- Full-bleed #FDFAF5 background
- Faint line-art illustrations scattered at ~10% opacity (book, stars, moon)
- App name "readme" in Caveat 48px, centred
- Tagline "stories read together" in Nunito 14px muted
- Faint lavender orb illustration hinting at the child experience
- Single pill button: "G  Sign in with Google" -- thin 1px border, white fill
- Hint text below: "for parents -- children need no login"

No navigation. No other actions.

### 2. Parent Dashboard

Shown after login. Two-column layout: slim sidebar + main content area.

**Sidebar** (#f0ece4 warm tinted):
- App wordmark "readme" top
- Profiles section: each child as a coloured avatar dot + name + age
- "+ add child" link (lavender)
- Progress link (muted)
- Sign out (bottom, muted)

**Main area**:
- "Your Library" heading with book emoji
- Book grid: each book as a card (coloured border, book emoji, title)
  - Coral card, sage card, etc. -- each book gets its own accent colour
- Upload card: dashed lavender border, large "+" centred, "Upload PDF" label
  - Click opens file picker; drag-and-drop also supported
- Recent activity hints below grid: "Last read by Mia: The BFG" etc.

**Mini orb** (bottom-right corner, always visible):
- ~48px lavender ellipse with a soft pulse animation
- This is the child's entry point -- always accessible
- No label needed; its presence signals "reading is available"
- Clicking/tapping it starts the voice session and expands to full screen

### 3. Child Reading Session

Activated when the mini orb is clicked. Takes over the full screen.

- Background: #0d0d0f (near-black)
- Faint constellation/star line-art at ~5% opacity
- Minimal top bar: book title (back arrow, muted) + live indicator (sage "live" dot)
- Centred orb: large (~280px), multicolour, animated -- from Pipecat Voice UI Kit
- Subtitle strip at bottom: current sentence being spoken, white text on dark strip
  - Arrives as RTVI transcript event via WebRTC -- bot pushes it
- No buttons. No menus. Voice only.

**Orb states**:
| State | Visual |
|---|---|
| idle | slow gentle pulse, dim colours |
| speaking | morphing, animated multicolour, expanded |
| listening | calm, steady glow, waiting |
| paused | dim, static, reduced opacity |

**The only touch interactions**:
- 1x tap orb: pause / resume
- 2x tap orb: exit -- returns to parent dashboard

---

## Interaction Model (Child Session)

Everything in the child session is voice-driven. There are no buttons to tap beyond the orb itself.

| Child action | Result |
|---|---|
| Speaks (any time) | Interrupts the reading; bot listens |
| Says "keep reading" | Bot resumes from where it stopped |
| Says "read [title]" | Bot starts reading that book |
| Says "what books do we have?" | Bot lists available titles |
| 1x taps orb | Pause / resume toggle |
| 2x taps orb | Exit session, return to dashboard |

The bot manages all state: which book, what position, what chunk.
The frontend only reacts to RTVI events -- it holds no reading state.

---

## User Flows

```
Parent flow:
  Landing
    -> Sign in with Google (Supabase Auth)
    -> Dashboard
      -> Upload PDF  -> book appears in library
      -> View progress per child

Child flow (no login):
  Dashboard (parent sees it / hands device)
    -> taps mini orb (bottom-right corner)
    -> orb expands full-screen
    -> bot greets: "Hi! What shall we read today?"
    -> child says "read The BFG"
    -> bot reads aloud
    -> child interrupts at any point by speaking
    -> child says "keep reading" to resume
    -> child double-taps orb to exit
    -> returns to dashboard
```

---

## MVP Constraints

- No separate book-selection screen -- book selection is entirely voice-driven
- No per-child login or detection -- one session per household; MVP trusts the parent to hand
  the right device to the right child. Voice-based child detection is post-MVP.
- No pause/play buttons -- orb tap is the only physical control
- No progress bar or reading UI -- the voice and subtitle are the entire experience

---

## Files

| File | Contents |
|---|---|
| docs/ux-design.md | This document |
| docs/ux-wireframes.excalidraw | Editable Excalidraw source (import at excalidraw.com) |
| docs/architecture.md | Tech stack and architecture decisions |
