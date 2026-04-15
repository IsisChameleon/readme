import { BookOpen, ChevronRight, Mic, Play, Settings, Upload, Volume2, X } from "lucide-react"
import { DragonIcon, SectionHeader } from "../_lib/shared"

export default function ComponentsPage() {
  return (
    <section className="mb-20">
      <SectionHeader
        title="Feature Components"
        subtitle="EmberTales-specific components styled with the Enchanted Forest system."
      />

      {/* Home Strip — Strip Companions (approved) */}
      <div className="mb-12">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">Home Strip — Strip Companions</h3>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>Used in:</strong> Home page (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]</code>) — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">components/HomeCard.tsx</code>
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          One skeleton, three verbs. Every card in the home strip shares the same anatomy so they line up cleanly: <strong>chip</strong> (top-left of cover), <strong>hero</strong> (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-40</code> gradient with title overlay), <strong>meta row</strong> (progress or count), <strong>amber primary CTA</strong>, and <strong>secondary footer link</strong>. Only the copy, gradient, chip identity, and destination change.
        </p>

        {/* Scroll-adaptive strip: horizontal on wide screens, vertical on narrow */}
        <div className="flex flex-col gap-5 md:flex-row md:overflow-x-auto md:pb-4 md:snap-x md:snap-mandatory">
          {/* Populated — Fynn, resuming */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shrink-0 md:w-80 md:snap-start">
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C56B8A] to-[#8B6DAF]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3">
                <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30 hover:ring-white/60 cursor-pointer transition-all">
                  <div className="h-7 w-7 rounded-full bg-[#C56B8A] flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/80">F</div>
                  <span className="text-xs font-semibold text-white">Fynn</span>
                  <ChevronRight className="w-3 h-3 text-white/80" />
                </div>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-xs text-white/70 mb-0.5">Reading now</p>
                <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow">Where the Wild Things Are</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-[#C56B8A]" />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">67% complete · Chapter 8 of 12</p>
              </div>
              <button className="w-full font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 transition-all">
                <Play className="h-4 w-4" />
                Continue reading
              </button>
              <button className="w-full flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors">
                <span>See all 8 of Fynn&apos;s books</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Empty — Luca, no last book */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shrink-0 md:w-80 md:snap-start">
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#6B8FD4] to-[#5BAEC4]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3">
                <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30 hover:ring-white/60 cursor-pointer transition-all">
                  <div className="h-7 w-7 rounded-full bg-[#6B8FD4] flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/80">L</div>
                  <span className="text-xs font-semibold text-white">Luca</span>
                  <ChevronRight className="w-3 h-3 text-white/80" />
                </div>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-xs text-white/70 mb-0.5">Ready to begin</p>
                <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow">Pick a first story</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden border border-dashed border-border" />
                <p className="mt-1.5 text-xs text-muted-foreground">No book started yet</p>
              </div>
              <button className="w-full font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 transition-all">
                <BookOpen className="h-4 w-4" />
                Pick a story
              </button>
              <button className="w-full flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors">
                <span>See all 3 of Luca&apos;s books</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* UploadCard — parent affordance */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shrink-0 md:w-80 md:snap-start">
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-[#40916C]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-3 left-3">
                <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30 hover:ring-white/60 cursor-pointer transition-all">
                  <div className="h-7 w-7 rounded-full bg-background/20 flex items-center justify-center ring-2 ring-white/80">
                    <BookOpen className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white">Library</span>
                  <ChevronRight className="w-3 h-3 text-white/80" />
                </div>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-xs text-white/70 mb-0.5">Household shelf</p>
                <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow">Add a new book</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-5/6 rounded-full bg-primary" />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">12 books ready · 1 processing</p>
              </div>
              <button className="w-full font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 transition-all">
                <Upload className="h-4 w-4" />
                Add a book
              </button>
              <button className="w-full flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors">
                <span>See all 12 books</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground space-y-1.5">
          <p><strong className="text-foreground">Chip (top-left):</strong> kid chip uses the kid&apos;s color + initial; Library chip uses primary gradient + BookOpen icon. Both link to their respective full library.</p>
          <p><strong className="text-foreground">CTA:</strong> always amber (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-accent</code>) — the primary 90% action.</p>
          <p><strong className="text-foreground">Footer link:</strong> secondary, plain-language &ldquo;See all N of X&rdquo; — the single named escape hatch.</p>
          <p><strong className="text-foreground">Scroll:</strong> horizontal in landscape (md+), vertical in portrait. <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">snap-x snap-mandatory</code> for smooth paging.</p>
        </div>
      </div>

      {/* BookCard */}
      <div className="mb-12">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">BookCard</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <strong>Used in:</strong> Library → Books tab (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/library</code>) and Kid home (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/kid/[kidId]</code>) — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">components/BookCard.tsx</code>
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Both variants share the Strip Companion&apos;s vocabulary: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-1.5</code> progress bars, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-muted</code> track, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">text-xs text-muted-foreground</code> captions, amber CTA on kid surfaces. Density and radius differ on purpose — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">rounded-2xl</code> + fixed hero for kids, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">rounded-xl</code> + horizontal compact for parents.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Kid Version — harmonized with Strip Companion */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Kid Version (kid library grid)</p>
            <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-xs">
              {/* Fixed h-44 hero — was aspect-[2/3] (too elongated). Now echoes Strip hero rhythm. */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src="https://covers.openlibrary.org/b/id/8228691-L.jpg"
                  alt="Where the Wild Things Are"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow line-clamp-2">Where the Wild Things Are</p>
                  <p className="text-xs text-white/80 mt-0.5">By Maurice Sendak</p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-primary" />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">Chapter 8 of 12 · 75%</p>
                </div>
                <button className="font-[family-name:var(--font-marcellus)] w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 transition-all">
                  <Play className="h-4 w-4" />
                  Continue
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground max-w-xs">
              <strong>Changed:</strong> dropped <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">aspect-[2/3]</code> cover (which made cards ~320×480) for a fixed <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-44</code> hero with title overlay. Card total now ~320×360 — grid scans cleanly, kids see more books per screen, and the anatomy matches the Home Strip.
            </p>
          </div>

          {/* Parent Version — harmonized progress rows */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Parent Version (Books tab, compact)</p>
            <div className="rounded-xl border border-border bg-card p-4 flex gap-4">
              <div className="h-24 w-16 rounded-lg overflow-hidden shrink-0">
                <img src="https://covers.openlibrary.org/b/id/8228691-L.jpg" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-[family-name:var(--font-marcellus)] font-semibold truncate">{"The Dragon's Garden"}</h4>
                    <p className="text-xs text-muted-foreground truncate">Emily Woods · Ready</p>
                  </div>
                  <button className="shrink-0 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: "#C56B8A" }} />
                    <span className="text-xs text-muted-foreground shrink-0 w-12 truncate">Fynn</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: "#C56B8A" }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">75%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: "#6B8FD4" }} />
                    <span className="text-xs text-muted-foreground shrink-0 w-12 truncate">Luca</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-1/4 rounded-full" style={{ backgroundColor: "#6B8FD4" }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">25%</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <strong>Changed:</strong> replaced tinted mini-avatar circles + <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-secondary</code> tracks with <strong>kid-colored dots</strong> + <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-muted</code> tracks filled in the reader&apos;s own color — same language as the Home Strip progress bars. Status moved inline after the author, freeing room for the cog. Kid name gets a fixed label column so rows align.
            </p>
          </div>
        </div>
      </div>

      {/* ReaderBookRow — Readers tab per-book progress */}
      <div className="mb-12">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-4 text-xl font-bold">ReaderBookRow</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <strong>Used in:</strong> Library → Readers tab — each kid&apos;s panel lists the books assigned to them with per-book progress.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Exact same visual language as the Strip Companion footer link and BookCard Parent rows — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-secondary/60</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">rounded-lg</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">px-3 py-2</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-1.5</code> bar filled in the kid&apos;s color. Progress bars speak one vocabulary across the whole app.
        </p>

        <div className="rounded-xl border border-border bg-card p-4 max-w-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: "#C56B8A" }}>F</div>
            <div className="flex-1">
              <h4 className="font-[family-name:var(--font-marcellus)] font-bold text-sm">Fynn</h4>
              <p className="text-xs text-muted-foreground">3 books · Last active today</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { title: "Where the Wild Things Are", progress: 67 },
              { title: "The Dragon and the Star", progress: 30 },
              { title: "The Gruffalo", progress: 0 },
            ].map((book) => (
              <div key={book.title} className="rounded-lg bg-secondary/60 px-3 py-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate text-foreground">{book.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{book.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${book.progress}%`, backgroundColor: "#C56B8A" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground max-w-lg">
          <strong>Changed:</strong> track color moved from <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-muted</code>-within-<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-secondary/50</code> to the Strip&apos;s <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-secondary/60</code> row with a <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-muted</code> track. Padding harmonized to <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">px-3 py-2</code>. Title is now <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">text-foreground</code> (not muted) so the book name reads as the primary content of the row — the % sits quiet on the right.
        </p>
      </div>

      {/* System rules callout */}
      <div className="mb-12 rounded-xl border border-border bg-card p-5">
        <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-3">Card system rules</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div><strong className="text-foreground">Kid-facing cards:</strong> <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">rounded-2xl</code>, fixed hero height (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-40</code>/<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-44</code>) with gradient + title overlay, amber CTA. Never <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">aspect-[2/3]</code> (too elongated for grids).</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div><strong className="text-foreground">Parent-facing cards:</strong> <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">rounded-xl</code>, horizontal permitted, tighter density (p-4, small 64×96 covers). No amber CTA — management surfaces don&apos;t compete with kid actions.</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div><strong className="text-foreground">Progress bars everywhere:</strong> <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-1.5 rounded-full bg-muted</code> track, filled in the kid&apos;s own color (or primary for aggregate/household). Caption <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">text-xs text-muted-foreground</code>.</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div><strong className="text-foreground">Footer / progress row chrome:</strong> <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">bg-secondary/60 rounded-lg px-3 py-2</code>. Used for Strip footer links, parent BookCard reader rows, and Readers tab book rows.</div>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div><strong className="text-foreground">Kid color as identity:</strong> same hex drives the kid chip, the progress-bar fill, the ReaderBookRow bar, and the avatar ring. One color per kid, everywhere.</div>
          </li>
        </ul>
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
    </section>
  )
}
