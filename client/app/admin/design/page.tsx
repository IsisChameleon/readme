"use client"

import { useState } from "react"
import { Moon, Sun, Play, Sparkles, Upload, Settings, ChevronRight, Plus, X, Check, Mic, Volume2, BookOpen } from "lucide-react"
import { EmberLogo } from "@/components/EmberLogo"

// Dragon mascot placeholder - replace with actual EmberDragon asset
function DragonIcon({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "h-6 w-6", md: "h-10 w-10", lg: "h-16 w-16", xl: "h-24 w-24" }
  return (
    <div 
      className={`${sizes[size]} ${className} rounded-xl bg-current opacity-20 flex items-center justify-center`}
      title="[EmberDragon placeholder]"
    >
      <span className="text-xs font-bold opacity-60 text-white">[D]</span>
    </div>
  )
}

export default function DesignSystemPage() {
  const [isDark, setIsDark] = useState(false)
  const [activeSection, setActiveSection] = useState("overview")

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "visual", label: "Visual Language" },
    { id: "primitives", label: "Core Primitives" },
    { id: "components", label: "Feature Components" },
    { id: "pages", label: "Page Patterns" },
    { id: "implementation", label: "Implementation" },
  ]

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <EmberLogo size={40} className="text-primary" />
              <div>
                <h1 className="font-[family-name:var(--font-marcellus)] text-2xl font-bold text-foreground">
                  EmberTales
                </h1>
                <p className="text-sm text-muted-foreground">Enchanted Forest Style Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      activeSection === s.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
              <button
                onClick={() => setIsDark(!isDark)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-12">
          {/* Section 1: Overview */}
          {(activeSection === "overview" || activeSection === "all") && (
            <section className="mb-20">
              <SectionHeader 
                title="Enchanted Forest" 
                subtitle="A mystical woodland theme — rich forest greens, warm amber accents, grounded in nature, touched by magic."
              />
              
              {/* Color Palette */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Color Palette</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <ColorSwatch name="Forest (Primary)" color="#2D6A4F" darkColor="#40916C" isDark={isDark} />
                  <ColorSwatch name="Woodland" color="#1B4332" darkColor="#243D30" isDark={isDark} />
                  <ColorSwatch name="Amber (Accent)" color="#E9A55F" darkColor="#E9A55F" isDark={isDark} />
                  <ColorSwatch name="Sage Cream (BG)" color="#F5F7F2" darkColor="#141F1A" isDark={isDark} />
                  <ColorSwatch name="Firefly Glow" color="#FFD170" darkColor="#FBBF24" isDark={isDark} />
                  <ColorSwatch name="Twilight Magic" color="#7C6DAF" darkColor="#9B8EC4" isDark={isDark} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  <strong>Glow</strong> — warm luminous gold for kid highlights, hover glows, sparkle moments.{" "}
                  <strong>Magic</strong> — twilight purple for celebrations, completion badges, special moments.
                </p>
              </div>

              {/* Typography */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border-2 border-primary bg-card p-6">
                  <p className="mb-2 text-sm font-medium text-primary">Display / Headings</p>
                  <p className="font-[family-name:var(--font-marcellus)] text-4xl text-card-foreground tracking-wide">
                    Marcellus
                  </p>
                  <p className="font-[family-name:var(--font-marcellus)] mt-4 text-2xl text-card-foreground tracking-wide">
                    EmberTales
                  </p>
                  <p className="font-[family-name:var(--font-marcellus)] mt-2 text-xl text-card-foreground">
                    The Enchanted Forest
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Classical Roman elegance with proper lowercase. Ancient, timeless, perfect for an enchanted forest theme.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Body Text</p>
                  <p className="font-[family-name:var(--font-nunito)] text-4xl font-bold text-card-foreground">
                    Nunito
                  </p>
                  <p className="font-[family-name:var(--font-nunito)] mt-4 text-lg text-card-foreground leading-relaxed">
                    Once upon a time, in a forest where fireflies danced between ancient oaks, there lived a gentle dragon named Ember.
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Soft, geometric, highly readable. Pairs beautifully with Marcellus - the serif/sans contrast creates clear hierarchy.
                  </p>
                </div>
              </div>

              {/* Full Pairing Preview */}
              <div className="mt-8 rounded-xl border border-border bg-card p-8">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-2 text-3xl tracking-wide">The Enchanted Forest</h3>
                <p className="font-[family-name:var(--font-nunito)] text-lg text-muted-foreground leading-relaxed">
                  Once upon a time, in a forest where fireflies danced between ancient oaks, there lived a gentle dragon named Ember. Every evening, as the sun painted the sky in shades of amber and rose, Ember would gather the woodland creatures for storytime. The little ones would nestle close, their eyes wide with wonder, as Ember&apos;s warm voice brought tales of brave heroes and magical lands to life.
                </p>
              </div>
            </section>
          )}

          {/* Section 2: Visual Language */}
          {(activeSection === "visual" || activeSection === "all") && (
            <section className="mb-20">
              <SectionHeader 
                title="Visual Language" 
                subtitle="Global rules for surfaces, borders, shadows, and motion."
              />
              
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Surface Treatment */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Surface Treatment</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>Cards:</strong> Solid white/dark surfaces with subtle borders. No heavy shadows.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>Elevation:</strong> Use border-border instead of shadows for separation.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>Kid cards:</strong> Warmth comes from book cover imagery, not background gradients. Cards use bg-card with visual interest from content.</div>
                    </li>
                  </ul>
                </div>

                {/* Border Radius */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Border Radius</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary" />
                      <div>
                        <p className="font-medium">rounded-lg (8px)</p>
                        <p className="text-sm text-muted-foreground">Inputs, small buttons</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary" />
                      <div>
                        <p className="font-medium">rounded-xl (12px)</p>
                        <p className="text-sm text-muted-foreground">Cards, modals, large buttons</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary" />
                      <div>
                        <p className="font-medium">rounded-2xl (16px)</p>
                        <p className="text-sm text-muted-foreground">Kid-facing cards, playful elements</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium">rounded-full</p>
                        <p className="text-sm text-muted-foreground">Avatars, icon buttons, pills</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interaction States */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Interaction States</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Hover:</strong> Subtle background shift (bg-primary/90) or scale(1.02) for cards</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Active:</strong> scale(0.98) + slightly darker background</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Focus:</strong> ring-2 ring-ring ring-offset-2 (forest green)</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Disabled:</strong> opacity-50 cursor-not-allowed</div>
                    </li>
                  </ul>
                </div>

                {/* Motion */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Motion Style</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Default:</strong> duration-200 ease-out (snappy but soft)</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Page transitions:</strong> duration-300 with subtle fade/slide</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Dragon animations:</strong> Playful spring physics (Framer Motion)</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                      <div><strong>Voice orb:</strong> Slow breathing pulse (2-3s cycles)</div>
                    </li>
                  </ul>
                </div>

                {/* Kid vs Parent Density */}
                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Kid vs Parent Density</h4>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="font-medium text-primary mb-2">Kid UI</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>- Larger touch targets (min 48px)</li>
                        <li>- More generous padding (p-6, gap-6)</li>
                        <li>- Bigger text (text-lg base, text-2xl headings)</li>
                        <li>- Rounded-2xl corners</li>
                        <li>- Dragon mascot present</li>
                        <li>- Marcellus for headings</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-primary mb-2">Parent UI</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>- Standard touch targets (40px)</li>
                        <li>- Tighter padding (p-4, gap-4)</li>
                        <li>- Regular text sizes (text-base)</li>
                        <li>- Rounded-xl corners</li>
                        <li>- Dragon minimal or absent</li>
                        <li>- Nunito for body, Marcellus headings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Core Primitives */}
          {(activeSection === "primitives" || activeSection === "all") && (
            <section className="mb-20">
              <SectionHeader 
                title="Core Primitives" 
                subtitle="Button, Input, Card, Modal, and Toast styles."
              />
              
              {/* Buttons */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Button</h3>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex flex-wrap gap-4 mb-6">
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors">
                      <Sparkles className="h-4 w-4" />
                      Primary
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl border-2 border-primary bg-transparent px-5 py-2.5 font-semibold text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                      Outline
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 font-semibold text-secondary-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
                      Secondary
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl bg-transparent px-5 py-2.5 font-semibold text-foreground cursor-pointer hover:bg-secondary transition-colors">
                      Ghost
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl bg-destructive px-5 py-2.5 font-semibold text-destructive-foreground cursor-pointer hover:bg-destructive/90 transition-colors">
                      Destructive
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl bg-magic px-5 py-2.5 font-semibold text-white cursor-pointer hover:bg-magic-light transition-colors">
                      Magic
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-6">
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground cursor-pointer">
                      Small
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground cursor-pointer">
                      Default
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground cursor-pointer">
                      Large (Kid)
                    </span>
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground cursor-pointer">
                      <Settings className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Kid CTA variant:</strong> Accent (amber) with warm glow shadow. <strong>Magic variant:</strong> Twilight purple for celebrations and achievements.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 items-center">
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-3 rounded-2xl bg-accent px-8 py-4 text-lg font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 hover:shadow-accent/50 transition-all">
                      <Play className="h-6 w-6" />
                      Start Reading
                    </span>
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-3 rounded-2xl bg-magic px-8 py-4 text-lg font-bold text-white cursor-pointer hover:bg-magic-light shadow-[0_4px_14px] shadow-magic/30 hover:shadow-magic/50 transition-all">
                      <Sparkles className="h-6 w-6" />
                      Story Complete!
                    </span>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Input</h3>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Text Input</label>
                      <div className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-base ring-offset-background focus-within:ring-2 focus-within:ring-ring">
                        <input 
                          type="text" 
                          placeholder="Enter kid's name..." 
                          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">File Upload</label>
                      <div className="flex h-11 w-full items-center gap-3 rounded-xl border border-dashed border-input bg-background px-4 py-2 text-muted-foreground cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                        <Upload className="h-5 w-5" />
                        <span>Choose PDF or drop here</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Inputs use rounded-xl, border-input, and show ring-ring on focus. Kid inputs may be taller (h-14) with larger text.
                  </p>
                </div>
              </div>

              {/* Cards */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Card</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Base Card */}
                  <div className="rounded-xl border border-border bg-card p-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Base Card</p>
                    <p className="text-card-foreground">
                      Simple container with rounded-xl, border-border, bg-card. No shadow by default.
                    </p>
                  </div>
                  {/* Interactive Card */}
                  <div className="rounded-xl border border-border bg-card p-6 cursor-pointer hover:border-primary hover:scale-[1.02] transition-all">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Interactive Card</p>
                    <p className="text-card-foreground">
                      Adds hover:border-primary, hover:scale-[1.02], and cursor-pointer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Preview */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Modal / Dialog</h3>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="relative rounded-xl border border-border bg-card p-6 max-w-md mx-auto shadow-lg">
                    <button className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                    <h4 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-2">Add a Reader</h4>
                    <p className="text-sm text-muted-foreground mb-4">{"Create a profile for your child."}</p>
                    <div className="h-10 w-full rounded-xl border border-input bg-background mb-4" />
                    <div className="flex gap-3 justify-end">
                      <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center rounded-xl bg-secondary px-4 py-2 font-semibold text-secondary-foreground cursor-pointer">
                        Cancel
                      </span>
                      <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground cursor-pointer">
                        Create
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Overlay: bg-black/50 backdrop-blur-sm. Modal: rounded-xl, bg-card, shadow-lg, p-6.
                  </p>
                </div>
              </div>

              {/* Toast */}
              <div>
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Toast</h3>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="space-y-3 max-w-sm">
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-md">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Book uploaded!</p>
                        <p className="text-xs text-muted-foreground">Processing will take a moment.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-destructive/50 bg-destructive/10 p-4">
                      <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <X className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-destructive">Upload failed</p>
                        <p className="text-xs text-muted-foreground">Please try again.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 4: Feature Components */}
          {(activeSection === "components" || activeSection === "all") && (
            <section className="mb-20">
              <SectionHeader 
                title="Feature Components" 
                subtitle="EmberTales-specific components styled with the Enchanted Forest system."
              />
              
              {/* KidCard + UploadCard */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">KidCard + UploadCard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Used in:</strong> Home page (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]</code>) — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">components/HomeCard.tsx</code>
                </p>
                <p className="text-xs text-muted-foreground mb-2 italic">Quick-access action strip. Scrolls horizontally in landscape, vertically in portrait. One card per family member + upload.</p>

                {/* Scroll-adaptive strip: horizontal on wide screens, vertical on narrow */}
                <div className="flex flex-col gap-5 md:flex-row md:overflow-x-auto md:pb-4 md:snap-x md:snap-mandatory">

                  {/* KidCard — Emma, resuming a book */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary transition-all shrink-0 md:w-80 md:snap-start">
                    {/* Book cover hero */}
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src="https://covers.openlibrary.org/b/id/8228691-L.jpg"
                        alt="Where the Wild Things Are"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {/* Kid identity overlaid on cover */}
                      <div className="absolute bottom-3 left-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-white ring-2 ring-white/80">
                          E
                        </div>
                        <div>
                          <p className="font-[family-name:var(--font-marcellus)] text-base font-bold text-white">Emma</p>
                          <p className="text-xs text-white/80">Reading now</p>
                        </div>
                      </div>
                    </div>
                    {/* Book info + progress */}
                    <div className="p-4">
                      <p className="font-[family-name:var(--font-marcellus)] font-semibold text-sm truncate">Where the Wild Things Are</p>
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-2/3 rounded-full bg-primary" />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">67% complete</span>
                        <span className="text-sm font-semibold text-primary">Continue &rarr;</span>
                      </div>
                    </div>
                  </div>

                  {/* KidCard — Liam, ready to start */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-accent transition-all shrink-0 md:w-80 md:snap-start">
                    {/* Book cover hero */}
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src="https://covers.openlibrary.org/b/id/12547191-L.jpg"
                        alt="The Gruffalo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-lg font-bold text-white ring-2 ring-white/80">
                          L
                        </div>
                        <div>
                          <p className="font-[family-name:var(--font-marcellus)] text-base font-bold text-white">Liam</p>
                          <p className="text-xs text-white/80">New book ready</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-[family-name:var(--font-marcellus)] font-semibold text-sm truncate">The Gruffalo</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">by Julia Donaldson</span>
                        <span className="text-sm font-semibold text-accent">Start reading &rarr;</span>
                      </div>
                    </div>
                  </div>

                  {/* KidCard — Sophie, no book */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-magic transition-all shrink-0 md:w-80 md:snap-start">
                    {/* Fallback: colored block when no cover */}
                    <div className="relative h-36 overflow-hidden bg-magic/20 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-magic/40" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-magic flex items-center justify-center text-lg font-bold text-white ring-2 ring-white/80">
                          S
                        </div>
                        <div>
                          <p className="font-[family-name:var(--font-marcellus)] text-base font-bold text-white">Sophie</p>
                          <p className="text-xs text-white/80">No books yet</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground">Upload a book to get started</p>
                    </div>
                  </div>

                  {/* UploadCard */}
                  <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all shrink-0 md:w-64 md:snap-start min-h-[220px]">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <p className="font-[family-name:var(--font-marcellus)] font-semibold">Add a Book</p>
                      <p className="text-sm text-muted-foreground">Drop PDF or click to browse</p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  <strong>Scroll:</strong> Horizontal in landscape (md+), vertical in portrait. Uses <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">snap-x snap-mandatory</code> for smooth paging.
                  <strong> Cover fallback:</strong> Kid-color block with BookOpen icon when no cover image available.
                </p>
              </div>

              {/* BookCard */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">BookCard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Used in:</strong> Dashboard (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/dashboard</code>) and Kid home (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/kid/[kidId]</code>) — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">components/BookCard.tsx</code>
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Kid Version */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Kid Version (vertical, playful)</p>
                    <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-xs">
                      <div className="aspect-[2/3] overflow-hidden">
                        <img
                          src="https://covers.openlibrary.org/b/id/8228691-L.jpg"
                          alt="Where the Wild Things Are"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <h4 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-1">Where the Wild Things Are</h4>
                        <p className="text-sm text-muted-foreground mb-3">By Maurice Sendak</p>
                        <div className="h-2 w-full rounded-full bg-secondary mb-2">
                          <div className="h-full w-3/4 rounded-full bg-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Chapter 8 of 12</p>
                        <span className="font-[family-name:var(--font-marcellus)] w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-lg font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 hover:shadow-accent/50 transition-all">
                          <Play className="h-5 w-5" />
                          Continue
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parent Version */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Parent Version (horizontal, compact)</p>
                    <div className="rounded-xl border border-border bg-card p-4 flex gap-4">
                      <div className="h-24 w-16 rounded-lg overflow-hidden shrink-0">
                        <img src="https://covers.openlibrary.org/b/id/8228691-L.jpg" alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold truncate">{"The Dragon's Garden"}</h4>
                            <p className="text-sm text-muted-foreground">Emily Woods</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Ready
                          </span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">E</div>
                            <div className="flex-1 h-1.5 rounded-full bg-secondary">
                              <div className="h-full w-3/4 rounded-full bg-primary" />
                            </div>
                            <span className="text-xs text-muted-foreground">75%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">L</div>
                            <div className="flex-1 h-1.5 rounded-full bg-secondary">
                              <div className="h-full w-1/4 rounded-full bg-accent" />
                            </div>
                            <span className="text-xs text-muted-foreground">25%</span>
                          </div>
                        </div>
                      </div>
                      <button className="self-start h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* KidSelector */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">KidSelector</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Used in:</strong> Dashboard (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/dashboard</code>) — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">components/KidSelector.tsx</code>
                </p>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-5 overflow-x-auto p-2">
                    {[
                      { name: "Emma", color: "#C56B8A", selected: true },
                      { name: "Liam", color: "#6B8FD4", selected: false },
                      { name: "Sophie", color: "#8B6DAF", selected: false },
                    ].map((kid) => (
                      <div key={kid.name} className="flex flex-col items-center gap-2 shrink-0">
                        <div
                          className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white cursor-pointer transition-all ${kid.selected ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "opacity-70 hover:opacity-100"}`}
                          style={{ backgroundColor: kid.color }}
                        >
                          {kid.name[0]}
                        </div>
                        <span className={`text-sm ${kid.selected ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {kid.name}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="h-16 w-16 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Add</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AnimatedOrb Preview */}
              <div>
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">AnimatedOrb (Voice UI)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Used in:</strong> Call page (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/kid/[kidId]/call</code>) — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">components/AnimatedOrb.tsx</code>
                </p>
                <p className="text-sm text-muted-foreground mb-4">Voice session supports both light and dark mode. Kids can choose based on preference or time of day.</p>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Dark Mode Orb */}
                  <div className="rounded-xl border border-border bg-[#141F1A] p-8">
                    <p className="text-center text-sm text-[#8FAF9B] mb-6">Dark Mode</p>
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-48 w-48 rounded-full border border-primary/20 animate-pulse" />
                      <div className="absolute h-36 w-36 rounded-full border border-primary/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
                      <div className="absolute h-24 w-24 rounded-full border border-primary/40 animate-pulse" style={{ animationDelay: "1s" }} />
                      <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                        <DragonIcon className="text-white" size="lg" />
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-[#E8EDE3] text-lg font-medium">{"\"Once upon a time...\""}</p>
                      <p className="text-[#8FAF9B] text-sm mt-2">Ember is reading</p>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center text-white cursor-pointer">
                        <X className="h-5 w-5" />
                      </div>
                      <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer">
                        <Mic className="h-7 w-7" />
                      </div>
                      <div className="h-12 w-12 rounded-full bg-[#243D30] flex items-center justify-center text-[#8FAF9B] cursor-pointer">
                        <Volume2 className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  {/* Light Mode Orb */}
                  <div className="rounded-xl border border-border bg-[#F5F7F2] p-8">
                    <p className="text-center text-sm text-muted-foreground mb-6">Light Mode</p>
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-48 w-48 rounded-full border border-primary/30 animate-pulse" />
                      <div className="absolute h-36 w-36 rounded-full border border-primary/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
                      <div className="absolute h-24 w-24 rounded-full border border-primary/50 animate-pulse" style={{ animationDelay: "1s" }} />
                      <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <DragonIcon className="text-white" size="lg" />
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-[#1B4332] text-lg font-medium">{"\"Once upon a time...\""}</p>
                      <p className="text-[#5A7A6A] text-sm mt-2">Ember is reading</p>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-destructive flex items-center justify-center text-white cursor-pointer">
                        <X className="h-5 w-5" />
                      </div>
                      <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer">
                        <Mic className="h-7 w-7" />
                      </div>
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground cursor-pointer">
                        <Volume2 className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kid Color Palette */}
              <div className="mt-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Kid Color Palette</h3>
                <p className="text-sm text-muted-foreground mb-6">Each kid chooses their color during onboarding. Palette is drawn from the enchanted forest — every color belongs in the woodland.</p>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="grid grid-cols-7 gap-4">
                    <KidColorSwatch name="Firefly" color="#E9A55F" />
                    <KidColorSwatch name="Fern" color="#5CB87A" />
                    <KidColorSwatch name="Bluebell" color="#6B8FD4" />
                    <KidColorSwatch name="Berry" color="#C56B8A" />
                    <KidColorSwatch name="Moss" color="#8FB56A" />
                    <KidColorSwatch name="Plum" color="#8B6DAF" />
                    <KidColorSwatch name="Stream" color="#5BAEC4" />
                  </div>
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm font-medium mb-4">Usage Example: KidCard with color accent</p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { name: "Sophie", color: "#8B6DAF" },
                        { name: "Max", color: "#6B8FD4" },
                        { name: "Emma", color: "#C56B8A" },
                      ].map((kid) => (
                        <div key={kid.name} className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
                          <div
                            className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: kid.color }}
                          >
                            {kid.name[0]}
                          </div>
                          <div>
                            <p className="font-[family-name:var(--font-marcellus)] font-semibold">{kid.name}</p>
                            <p className="text-sm text-muted-foreground">3 stories</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 5: Page Patterns */}
          {(activeSection === "pages" || activeSection === "all") && (
            <section className="mb-20">
              <SectionHeader 
                title="Page Patterns" 
                subtitle="How the system adapts across different surfaces."
              />
              
              <div className="grid gap-6 lg:grid-cols-2">
                <PagePatternCard
                  title="Auth Pages"
                  items={[
                    "Light background (sage-cream)",
                    "Centered card layout, max-w-md",
                    "EmberDragon mascot as decorative element",
                    "Primary buttons for main actions",
                    "Subtle forest accents",
                  ]}
                />
                <PagePatternCard
                  title="Onboarding"
                  items={[
                    "Light background with progress bar at top",
                    "Step indicators in primary color",
                    "Large, friendly inputs",
                    "Color picker uses all kid colors",
                    "Dragon appears on completion",
                  ]}
                />
                <PagePatternCard
                  title="Home Strip"
                  items={[
                    "Landing page after login",
                    "Flex-wrap card strip (vertical portrait, horizontal landscape)",
                    "One KidCard per reader + UploadCard",
                    "KidCards: cover hero with kid identity overlay",
                    "Cards grow to fill (flex-1, min-w-80, max-w-[32rem])",
                    "Header: dragon logo + kid avatars + settings cog",
                  ]}
                />
                <PagePatternCard
                  title="Manage (tabbed)"
                  items={[
                    "Two tabs: Library | Readers",
                    "Sticky header: back arrow + logo + tab bar + profile menu",
                    "Library = default tab, Readers = secondary",
                    "Compact parent density (p-4, gap-4, rounded-xl)",
                    "Sign out in profile menu, not standalone button",
                  ]}
                />
                <PagePatternCard
                  title="Kid Home"
                  items={[
                    "Light background, generous padding",
                    "Large greeting with dragon mascot",
                    "Vertical BookCards in grid",
                    "Big amber CTA buttons",
                    "Rounded-2xl corners throughout",
                  ]}
                />
                <PagePatternCard
                  title="Voice Session"
                  items={[
                    "Light or dark mode (kid preference)",
                    "Dark: #141F1A bg, Light: #F5F7F2 bg",
                    "Full-screen, immersive experience",
                    "AnimatedOrb as central focus",
                    "Transcript overlay at bottom",
                    "Minimal UI, large touch targets",
                  ]}
                />
                <PagePatternCard
                  title="Empty States"
                  items={[
                    "Centered layout with dragon mascot",
                    "Friendly, encouraging copy",
                    "Single primary CTA",
                    "Subtle muted-foreground text",
                  ]}
                />
              </div>

              {/* ── Manage Page Wireframes ── */}
              <div className="mt-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-2 text-xl font-bold">Manage Page — Wireframes</h3>
                <p className="text-sm text-muted-foreground mb-6">Two-tab layout: Library (books) and Readers (kids + progress). Parent lands on Library by default.</p>

                {/* Shared header wireframe */}
                <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
                  <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">&larr;</div>
                      <div className="flex items-center gap-2">
                        <EmberLogo size={32} className="text-primary shrink-0" />
                        <span className="font-[family-name:var(--font-marcellus)] font-bold">EmberTales</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Tab bar */}
                      <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                        <span className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Library</span>
                        <span className="px-4 py-1.5 rounded-lg text-sm text-muted-foreground cursor-pointer hover:text-foreground">Readers</span>
                      </div>
                      {/* Profile avatar — Google-style */}
                      <div className="relative group">
                        <button className="h-10 w-10 rounded-full ring-[3px] ring-primary/50 hover:ring-primary transition-all bg-[#5CB87A] flex items-center justify-center text-sm font-bold text-white cursor-pointer">
                          I
                        </button>
                        {/* Hover tooltip: name + email */}
                        <div className="absolute right-0 top-12 w-56 rounded-lg bg-foreground text-background px-3 py-2 text-xs shadow-lg z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                          <p className="font-semibold">Isabelle De Backer</p>
                          <p className="text-background/70">isabelle@example.com</p>
                        </div>
                        {/* Click menu (shown statically for wireframe) */}
                        <div className="absolute right-0 top-14 w-72 rounded-xl border border-border bg-card shadow-lg z-10 overflow-hidden">
                          <div className="p-4 text-center border-b border-border">
                            <div className="h-16 w-16 rounded-full bg-[#5CB87A] flex items-center justify-center text-2xl font-bold text-white mx-auto ring-[3px] ring-primary/40">I</div>
                            <p className="font-[family-name:var(--font-marcellus)] font-bold mt-2">Hi, Isabelle!</p>
                            <p className="text-xs text-muted-foreground">isabelle@example.com</p>
                          </div>
                          <div className="py-1">
                            <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary cursor-pointer transition-colors">
                              <ChevronRight className="w-4 h-4" />
                              <span>Sign out</span>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors">
                              <X className="w-4 h-4" />
                              <span>Delete account</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Library tab wireframe ── */}
                  <div className="p-6">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Library tab</p>

                    {/* Upload row */}
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-3 mb-6 hover:border-primary/50 cursor-pointer transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Add a book</p>
                        <p className="text-xs text-muted-foreground">Drop PDF or click to browse</p>
                      </div>
                    </div>

                    {/* Book grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { title: "The Dragon and the Star", author: "EmberTales Team", status: "Ready", color: "#5CB87A" },
                        { title: "Where the Wild Things Are", author: "Maurice Sendak", status: "Ready", color: "#6B8FD4" },
                        { title: "gutenberg_cache_27922.txt", author: "Unknown", status: "Processing", color: "#E9A55F" },
                      ].map((book) => (
                        <div key={book.title} className="rounded-xl border border-border bg-card overflow-hidden">
                          {/* Cover placeholder */}
                          <div className="h-28 flex flex-col items-center justify-center p-3 text-center" style={{ backgroundColor: book.color }}>
                            <BookOpen className="w-6 h-6 text-white/40 mb-1" />
                            <p className="text-white/90 text-xs font-bold leading-tight line-clamp-2">{book.title}</p>
                          </div>
                          <div className="p-3">
                            <p className="font-[family-name:var(--font-marcellus)] font-semibold text-sm truncate">{book.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${book.status === "Ready" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                                {book.status}
                              </span>
                              <div className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground cursor-pointer">
                                <Settings className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Readers tab wireframe ── */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">&larr;</div>
                      <div className="flex items-center gap-2">
                        <EmberLogo size={32} className="text-primary shrink-0" />
                        <span className="font-[family-name:var(--font-marcellus)] font-bold">EmberTales</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                        <span className="px-4 py-1.5 rounded-lg text-sm text-muted-foreground cursor-pointer hover:text-foreground">Library</span>
                        <span className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Readers</span>
                      </div>
                      <button className="h-10 w-10 rounded-full ring-[3px] ring-primary/50 hover:ring-primary transition-all bg-[#5CB87A] flex items-center justify-center text-sm font-bold text-white cursor-pointer">
                        I
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Readers tab</p>

                    <div className="space-y-4">
                      {/* Emma — 3 books */}
                      <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 bg-[#C56B8A]">E</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-[family-name:var(--font-marcellus)] font-bold">Emma</h4>
                            <span className="text-xs text-muted-foreground">Last active: Today</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">3 books</p>
                          <div className="space-y-2">
                            {[
                              { title: "Where the Wild Things Are", progress: 67 },
                              { title: "The Dragon and the Star", progress: 30 },
                              { title: "The Gruffalo", progress: 0 },
                            ].map((book) => (
                              <div key={book.title} className="rounded-lg bg-secondary/50 p-2.5">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="truncate text-muted-foreground">{book.title}</span>
                                  <span className="font-semibold text-foreground shrink-0 ml-2">{book.progress}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-[#C56B8A]" style={{ width: `${book.progress}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground cursor-pointer shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Liam — 1 book */}
                      <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 bg-[#6B8FD4]">L</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-[family-name:var(--font-marcellus)] font-bold">Liam</h4>
                            <span className="text-xs text-muted-foreground">Last active: 2 days ago</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">1 book</p>
                          <div className="rounded-lg bg-secondary/50 p-2.5">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="truncate text-muted-foreground">The Gruffalo</span>
                              <span className="font-semibold text-foreground shrink-0 ml-2">25%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-[#6B8FD4]" style={{ width: '25%' }} />
                            </div>
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground cursor-pointer shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Add reader button */}
                      <button className="w-full rounded-xl border-2 border-dashed border-border p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground hover:bg-primary/5 transition-colors">
                        <Plus className="w-5 h-5" />
                        <span className="text-sm font-semibold">Add a reader</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interaction notes */}
                <div className="mt-6 rounded-xl border border-border bg-card p-5">
                  <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-3">Interaction Notes</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Cog icon (per book)</strong> — opens a dropdown menu: Edit title/author/cover, Delete book.</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Cog icon (per reader)</strong> — opens a dropdown menu: Edit name/color, Delete reader and their progress.</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Profile avatar (top-right)</strong> — user initial with 3px ring (ring-primary/50, solid on hover). <em>Hover:</em> dark tooltip with name + email. <em>Click:</em> Google-style popover with large avatar, greeting, Sign out, Delete account.</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Upload row</strong> — click anywhere on the row to browse, or drag-drop a PDF onto it. Replaces the current full-width drop zone.</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Tab pill toggle</strong> — bg-secondary container with active pill in bg-primary. Sits in header so it stays visible on scroll.</span></li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Book grid</strong> — consistent card sizes with deterministic cover color from title. Status: green = Ready, amber = Processing.</span></li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Section 6: Implementation */}
          {(activeSection === "implementation" || activeSection === "all") && (
            <section className="mb-20">
              <SectionHeader 
                title="Implementation Notes" 
                subtitle="Tailwind patterns and component structure guidance."
              />
              
              <div className="space-y-8">
                {/* Tailwind Patterns */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Tailwind Class Patterns</h4>
                  <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-4 text-sm">
                    <code>{`// Backgrounds
bg-background         // Page backgrounds (#F5F7F2 light, #141F1A dark)
bg-card               // Card surfaces
bg-primary            // Primary buttons (#2D6A4F)
bg-accent             // Accent/CTA buttons (#E9A55F)
bg-secondary          // Secondary surfaces
bg-destructive        // Error states
bg-glow               // Firefly gold highlights (#FFD170)
bg-magic              // Twilight purple specials (#7C6DAF)

// Text
text-foreground           // Primary text
text-muted-foreground     // Secondary text
text-primary              // Links, emphasis
text-card-foreground      // Text on cards
text-primary-foreground   // Text on primary bg (white)

// Fonts
font-[family-name:var(--font-marcellus)]   // Headings, buttons, kid UI
font-sans                                 // Body text (Nunito via CSS)

// Borders & Radius
border-border         // Default borders
border-input          // Input borders
rounded-lg            // Inputs, small elements (8px)
rounded-xl            // Cards, modals, parent UI (12px)
rounded-2xl           // Kid cards, playful elements (16px)
rounded-full          // Avatars, pills, icon buttons

// Interactive
hover:bg-primary/90   // Button hover
hover:scale-[1.02]    // Card hover
active:scale-[0.98]   // Press feedback
focus:ring-2 focus:ring-ring focus:ring-offset-2  // Focus state
transition-colors     // Color transitions
transition-all        // Transform + color transitions`}</code>
                  </pre>
                </div>

                {/* CVA Structure */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Button CVA Structure</h4>
                  <pre className="overflow-x-auto rounded-lg bg-foreground/5 p-4 text-sm">
                    <code>{`const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border-2 border-primary text-primary hover:bg-primary/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30", // Kid CTAs
        magic: "bg-magic text-white hover:bg-magic-light shadow-[0_4px_14px] shadow-magic/30", // Celebrations
      },
      size: {
        sm: "h-8 px-3 text-sm rounded-lg",
        default: "h-10 px-5 py-2.5 rounded-xl",
        lg: "h-14 px-8 py-4 text-lg rounded-2xl", // Kid-sized
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)`}</code>
                  </pre>
                </div>

                {/* Component Structure */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Component Structure Tips</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>BookCard:</strong> Use variant prop for kid vs parent. Kid variant uses rounded-2xl + vertical layout + accent CTA. Parent variant uses rounded-xl + horizontal layout + secondary actions.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>KidCard:</strong> Color stripe at top uses kid&apos;s assigned color. Avatar background is color/20 opacity.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>AnimatedOrb:</strong> Keep concentric rings as CSS (border + animate-pulse with staggered delays). Center gradient uses from-primary to-accent.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>EmberDragon:</strong> Use currentColor for fills to inherit parent color. Provide size prop (sm/md/lg/xl).</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div><strong>Dialogs:</strong> Use Radix Dialog. Overlay is bg-black/50 backdrop-blur-sm. Content is bg-card rounded-xl p-6 shadow-lg.</div>
                    </li>
                  </ul>
                </div>

                {/* Token Reference */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-4">Full Token Reference</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Token</th>
                          <th className="px-4 py-3 text-left font-semibold">Light</th>
                          <th className="px-4 py-3 text-left font-semibold">Dark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr><td className="px-4 py-2 font-mono text-xs">--background</td><td className="px-4 py-2">#F5F7F2</td><td className="px-4 py-2">#141F1A</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--foreground</td><td className="px-4 py-2">#1B4332</td><td className="px-4 py-2">#E8EDE3</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--primary</td><td className="px-4 py-2">#2D6A4F</td><td className="px-4 py-2">#40916C</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--accent</td><td className="px-4 py-2">#E9A55F</td><td className="px-4 py-2">#E9A55F</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--secondary</td><td className="px-4 py-2">#E8EDE3</td><td className="px-4 py-2">#243D30</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--muted-foreground</td><td className="px-4 py-2">#5A7A6A</td><td className="px-4 py-2">#8FAF9B</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--border</td><td className="px-4 py-2">#D4DDD0</td><td className="px-4 py-2">#2D4A3A</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--card</td><td className="px-4 py-2">#FFFFFF</td><td className="px-4 py-2">#1A2A22</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--destructive</td><td className="px-4 py-2">#DC2626</td><td className="px-4 py-2">#EF4444</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--glow</td><td className="px-4 py-2">#FFD170</td><td className="px-4 py-2">#FBBF24</td></tr>
                        <tr><td className="px-4 py-2 font-mono text-xs">--magic</td><td className="px-4 py-2">#7C6DAF</td><td className="px-4 py-2">#9B8EC4</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-[family-name:var(--font-marcellus)] text-3xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function ColorSwatch({ 
  name, 
  color, 
  darkColor,
  isDark 
}: { 
  name: string
  color: string
  darkColor: string
  isDark: boolean
}) {
  const displayColor = isDark ? darkColor : color
  
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div 
        className="h-16 w-full"
        style={{ backgroundColor: displayColor }}
      />
      <div className="p-3">
        <p className="font-medium text-card-foreground text-sm">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">{displayColor}</p>
      </div>
    </div>
  )
}

function KidColorSwatch({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="h-14 w-14 rounded-full shadow-md border-4 border-white cursor-pointer hover:scale-110 transition-transform"
        style={{ backgroundColor: color }}
      />
      <p className="text-xs font-medium text-muted-foreground">{name}</p>
      <p className="font-mono text-xs text-muted-foreground/70">{color}</p>
    </div>
  )
}

function PagePatternCard({ title, items, dark }: { title: string; items: string[]; dark?: boolean }) {
  return (
    <div className={`rounded-xl border border-border p-6 ${dark ? "bg-[#141F1A] text-[#E8EDE3]" : "bg-card"}`}>
      <h4 className="font-[family-name:var(--font-marcellus)] text-lg font-bold mb-3">{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <ChevronRight className={`h-4 w-4 mt-0.5 shrink-0 ${dark ? "text-[#40916C]" : "text-primary"}`} />
            <span className={dark ? "text-[#8FAF9B]" : "text-muted-foreground"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
