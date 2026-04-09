"use client"

import { useState } from "react"
import { Moon, Sun, Play, Sparkles, Upload, Settings, ChevronRight, Plus, X, Check, Mic, Volume2 } from "lucide-react"

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
              <DragonIcon className="text-primary" size="md" />
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ColorSwatch name="Forest (Primary)" color="#2D6A4F" darkColor="#40916C" isDark={isDark} />
                  <ColorSwatch name="Woodland" color="#1B4332" darkColor="#243D30" isDark={isDark} />
                  <ColorSwatch name="Amber (Accent)" color="#E9A55F" darkColor="#E9A55F" isDark={isDark} />
                  <ColorSwatch name="Sage Cream (BG)" color="#F5F7F2" darkColor="#141F1A" isDark={isDark} />
                </div>
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
                      <div><strong>Texture:</strong> None by default. Reserve for special moments (orb, voice UI).</div>
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
                    <strong>Kid CTA variant:</strong> Use accent (amber) background with rounded-2xl for main actions like Start Reading.
                  </p>
                  <div className="mt-4">
                    <span className="font-[family-name:var(--font-marcellus)] inline-flex items-center gap-3 rounded-2xl bg-accent px-8 py-4 text-lg font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 transition-colors">
                      <Play className="h-6 w-6" />
                      Start Reading
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
                <div className="grid gap-6 md:grid-cols-3">
                  {/* KidCard */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-primary hover:scale-[1.02] transition-all">
                    <div className="h-3 bg-primary" />
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                          E
                        </div>
                        <div>
                          <p className="font-[family-name:var(--font-marcellus)] text-xl font-bold">Emma</p>
                          <p className="text-sm text-muted-foreground">Reading now</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                        <div className="h-10 w-10 rounded-lg bg-accent/20" />
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{"The Dragon's Garden"}</p>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
                            <div className="h-full w-2/3 rounded-full bg-primary" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KidCard Alt Color */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer hover:border-accent hover:scale-[1.02] transition-all">
                    <div className="h-3 bg-accent" />
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center text-2xl font-bold text-accent">
                          L
                        </div>
                        <div>
                          <p className="font-[family-name:var(--font-marcellus)] text-xl font-bold">Liam</p>
                          <p className="text-sm text-muted-foreground">Last read 2 days ago</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">No book in progress</p>
                    </div>
                  </div>

                  {/* UploadCard */}
                  <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all min-h-[200px]">
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Upload className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <p className="font-[family-name:var(--font-marcellus)] font-semibold">Add a Book</p>
                      <p className="text-sm text-muted-foreground">Drop PDF or click to browse</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* BookCard */}
              <div className="mb-12">
                <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">BookCard</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Kid Version */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Kid Version (vertical, playful)</p>
                    <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-xs">
                      <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <DragonIcon className="text-primary opacity-50" size="xl" />
                      </div>
                      <div className="p-5">
                        <h4 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-1">{"The Dragon's Garden"}</h4>
                        <p className="text-sm text-muted-foreground mb-3">By Emily Woods</p>
                        <div className="h-2 w-full rounded-full bg-secondary mb-2">
                          <div className="h-full w-3/4 rounded-full bg-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">Chapter 8 of 12</p>
                        <span className="font-[family-name:var(--font-marcellus)] w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-lg font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 transition-colors">
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
                      <div className="h-24 w-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 shrink-0" />
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
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-4 overflow-x-auto pb-2">
                    {[
                      { name: "Emma", color: "bg-primary", selected: true },
                      { name: "Liam", color: "bg-accent", selected: false },
                      { name: "Sophie", color: "bg-[#A78BDA]", selected: false },
                    ].map((kid) => (
                      <div key={kid.name} className="flex flex-col items-center gap-2 shrink-0">
                        <div className={`h-14 w-14 rounded-full ${kid.color} flex items-center justify-center text-xl font-bold text-white cursor-pointer transition-all ${kid.selected ? "ring-2 ring-ring ring-offset-2" : "opacity-70 hover:opacity-100"}`}>
                          {kid.name[0]}
                        </div>
                        <span className={`text-sm ${kid.selected ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {kid.name}
                        </span>
                      </div>
                    ))}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="h-14 w-14 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
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
                <p className="text-sm text-muted-foreground mb-6">Each kid can choose their favorite color during onboarding. Used for their avatar ring, KidCard accent, and personalized UI touches.</p>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="grid grid-cols-7 gap-4">
                    <KidColorSwatch name="Ocean" color="#4A90D9" />
                    <KidColorSwatch name="Sunset" color="#FF7B54" />
                    <KidColorSwatch name="Sunshine" color="#FFD93D" />
                    <KidColorSwatch name="Forest" color="#6BCB77" />
                    <KidColorSwatch name="Lavender" color="#A78BDA" />
                    <KidColorSwatch name="Coral" color="#FF6B6B" />
                    <KidColorSwatch name="Sky" color="#7DD3FC" />
                  </div>
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-sm font-medium mb-4">Usage Example: KidCard with color accent</p>
                    <div className="flex flex-wrap gap-4">
                      {[
                        { name: "Sophie", color: "#A78BDA" },
                        { name: "Max", color: "#4A90D9" },
                        { name: "Emma", color: "#FF7B54" },
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
                  title="Parent Dashboard"
                  items={[
                    "Light background, compact density",
                    "Sticky header with logo + nav",
                    "Grid of KidCards + UploadCard",
                    "Horizontal BookCard layout",
                    "Settings gear uses ghost button style",
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
        accent: "bg-accent text-accent-foreground hover:bg-accent/90", // Kid CTAs
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
