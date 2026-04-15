import { Check, Play, Settings, Sparkles, Upload, X } from "lucide-react"
import { SectionHeader } from "../_lib/shared"

export default function PrimitivesPage() {
  return (
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
  )
}
