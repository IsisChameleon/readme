# Visual Design Review — EmberTales

## Status: TODO

## Scope

Review the visual design system across all pages (auth, onboarding, mode selector, parent dashboard, kid home, voice session).

## Brand Direction

This review also serves to **establish the EmberTales brand style**. The target aesthetic is:

- **Whimsical and colourful** — warm, inviting, never sterile or corporate
- **Studio Ghibli influence** — soft textures, hand-crafted feel, natural warmth, gentle wonder
- **Fantasy grimoires & dragon tales** — aged parchment textures, ornate borders, illustrated chapter headings, a sense of discovering a magical book
- **Alice in Wonderland energy** — playful surrealism, delightful surprises in the details, a world that feels slightly enchanted

The visual system should feel like opening a storybook — the UI itself should be part of the storytelling experience. Think illuminated manuscripts meets modern children's illustration. Every screen should feel like a page in a beautifully illustrated book, not a SaaS dashboard.

## Current Design Tokens

- **Background**: `#FDFAF5` (warm cream)
- **Foreground**: `#1e1e1e`
- **Accents**: Coral `#FF6B6B`, Sage `#7DC4A6`, Lavender `#A78BDA`, Amber `#F5A623`
- **Fonts**: Baloo 2 (display/headings), Nunito (body), Geist (mono/fallback)
- **Mascot**: EmberDragon (animated SVG, used on auth, mode selector, kid home, voice session)

## Review Checklist

### 1. Colour Usage
- Is the palette used consistently?
- Are accent colours differentiated by purpose (interactive, decorative, status)?
- Is there enough contrast for accessibility (WCAG AA)?
- Does the warm cream background work on all screens or does it feel washed out on some?

### 2. Typography Hierarchy
- Are heading sizes, weights, and fonts consistent across pages?
- Is Baloo 2 used only for display or does it leak into body text?
- Is the type scale appropriate for the two audiences (large/friendly for kids, functional for parents)?

### 3. Layout & Spacing
- Is the spacing system consistent (padding, margins, gaps)?
- Are parent pages (dashboard) information-dense enough?
- Are kid pages (kid home, voice session) simple and spacious enough?
- Does the layout break or feel cramped on mobile?

### 4. Component Consistency
- Do buttons, cards, inputs, and modals share a consistent style language?
- Are hover/active/focus states defined and accessible?
- Is the voice session page visually cohesive with the rest of the app or does it feel disconnected (it uses a dark `#150f20` background)?

### 5. Kid vs Parent Visual Differentiation
- Should kid-facing pages have a distinctly different visual treatment (larger text, more illustration, brighter colours) vs parent-facing pages (more structured, data-oriented)?

### Rating

For each finding, rate severity (cosmetic / inconsistency / accessibility issue) and propose a specific fix.
