import { BookOpen, ChevronRight, LogOut, MoreVertical, Play, Plus, Settings, Trash2, Upload, Users } from "lucide-react"
import { EmberLogo } from "@/components/EmberLogo"
import { PagePatternCard, SectionHeader } from "../_lib/shared"

// Shared wireframe header — mirrors the canonical AppHeader from /admin/design/headers.
function AppHeaderWire({ showBack, right }: { showBack?: boolean; right?: React.ReactNode }) {
  return (
    <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 shrink-0">
        {showBack && (
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">&larr;</div>
        )}
        <EmberLogo size={40} className="text-primary shrink-0" />
        <div>
          <h3 className="font-[family-name:var(--font-marcellus)] text-2xl font-bold text-foreground leading-tight">EmberTales</h3>
          <p className="text-sm text-muted-foreground">Stories, read together</p>
        </div>
      </div>
      <div className="flex-1" />
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  )
}

function UserAvatarCircle() {
  return (
    <button className="h-10 w-10 rounded-full ring-[3px] ring-primary/50 bg-[#5CB87A] flex items-center justify-center text-sm font-bold text-white">
      I
    </button>
  )
}

// Compact reusable Strip Companion card — used in the Home wireframe.
function StripCard({
  chipLabel,
  chipColor,
  chipInitial,
  chipIcon,
  gradient,
  metaLabel,
  title,
  progressColor,
  progressPct,
  ctaIcon,
  ctaLabel,
  footerLabel,
  emptyGhost,
}: {
  chipLabel: string
  chipColor?: string
  chipInitial?: string
  chipIcon?: React.ReactNode
  gradient: string
  metaLabel: string
  title: string
  progressColor?: string
  progressPct?: number
  ctaIcon: React.ReactNode
  ctaLabel: string
  footerLabel: string
  emptyGhost?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <div className={`absolute inset-0 ${gradient}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30">
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/80" style={chipColor ? { backgroundColor: chipColor } : undefined}>
              {chipIcon ?? chipInitial}
            </div>
            <span className="text-xs font-semibold text-white">{chipLabel}</span>
            <ChevronRight className="w-3 h-3 text-white/80" />
          </div>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-xs text-white/70 mb-0.5">{metaLabel}</p>
          <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow">{title}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          {emptyGhost ? (
            <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden border border-dashed border-border" />
          ) : (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progressPct ?? 0}%`, backgroundColor: progressColor }} />
            </div>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            {emptyGhost ? "No book started yet" : `${progressPct}% complete`}
          </p>
        </div>
        <button className="w-full font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-[0_4px_14px] shadow-accent/30">
          {ctaIcon}
          {ctaLabel}
        </button>
        <button className="w-full flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground">
          <span>{footerLabel}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

export default function PagesPage() {
  return (
    <section className="mb-20">
      <SectionHeader
        title="Page Patterns"
        subtitle="How the system adapts across different surfaces, using the canonical Feature Components."
      />

      {/* ── Overview cards ── */}
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
          title="Home"
          items={[
            "Landing page after login",
            "AppHeader: logo + subtitle, ProfileAvatar only (no kid nav)",
            "Strip Companions row: Populated KidCard · Empty KidCard · UploadCard",
            "Scroll-adaptive: horizontal in landscape, vertical in portrait",
            "Kid nav happens via the KidCard chip + footer link",
          ]}
        />
        <PagePatternCard
          title="Library"
          items={[
            "Parent's household book library",
            "AppHeader with back arrow + ProfileAvatar",
            "Upload row at top + book grid",
            "BookCard Parent (horizontal, per-kid progress dots)",
            "No tabs — separate route from Readers",
          ]}
        />
        <PagePatternCard
          title="Readers"
          items={[
            "Parent's view of each kid's progress",
            "AppHeader with back arrow + ProfileAvatar",
            "One panel per kid with ReaderBookRow list",
            "Add-reader button at the bottom",
            "No tabs — separate route from Library",
          ]}
        />
        <PagePatternCard
          title="Kid home"
          items={[
            "One kid's full book library",
            "AppHeader with back arrow, no profile menu",
            "Grid of BookCard Kid (h-44 hero, amber Continue CTA)",
            "Progress bars in the kid's own color",
            "Large touch targets, rounded-2xl throughout",
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

      {/* ── Navigation map ── */}
      <div className="mt-12 rounded-xl border border-border bg-card p-6">
        <h3 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-2">Navigation map</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Four routes, one popover menu as the primary bridge for parent surfaces. Every destination reachable in &le; 2 clicks from anywhere.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold mb-2">Routes</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[id]</code> — Home strip</li>
              <li><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[id]/library</code> — Parent book library</li>
              <li><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[id]/readers</code> — Readers + per-book progress</li>
              <li><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[id]/kid/[kidId]</code> — Kid home</li>
              <li><code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[id]/kid/[kidId]/call</code> — Voice session</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Edges</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><strong>Home → Kid home:</strong> kid chip or footer link on KidCard</li>
              <li><strong>Home → Library:</strong> Library chip or footer link on UploadCard · ProfileAvatar → Library</li>
              <li><strong>Home → Readers:</strong> ProfileAvatar → Manage readers</li>
              <li><strong>Library ↔ Readers:</strong> ProfileAvatar (current-page row collapses)</li>
              <li><strong>Any subpage → Home:</strong> back arrow</li>
              <li><strong>Kid home → Voice session:</strong> tap a book&apos;s amber &ldquo;Continue&rdquo;</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Wireframes ── */}
      <div className="mt-12">
        <h3 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-2">Wireframes</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Each surface rendered with the canonical Feature Components (Strip Companions, BookCard Kid, BookCard Parent, ReaderBookRow).
        </p>

        {/* ── Home wireframe ── */}
        <div className="mb-10">
          <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-1 text-base">Home — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]</code></h4>
          <p className="text-xs text-muted-foreground mb-3">AppHeader (no back, ProfileAvatar only) + Strip Companions row.</p>
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <AppHeaderWire right={<UserAvatarCircle />} />
            <div className="p-6">
              <div className="grid gap-5 md:grid-cols-3">
                <StripCard
                  chipLabel="Fynn"
                  chipColor="#C56B8A"
                  chipInitial="F"
                  gradient="bg-gradient-to-br from-[#C56B8A] to-[#8B6DAF]"
                  metaLabel="Reading now"
                  title="Where the Wild Things Are"
                  progressColor="#C56B8A"
                  progressPct={67}
                  ctaIcon={<Play className="h-4 w-4" />}
                  ctaLabel="Continue reading"
                  footerLabel="See all 8 of Fynn's books"
                />
                <StripCard
                  chipLabel="Luca"
                  chipColor="#6B8FD4"
                  chipInitial="L"
                  gradient="bg-gradient-to-br from-[#6B8FD4] to-[#5BAEC4]"
                  metaLabel="Ready to begin"
                  title="Pick a first story"
                  ctaIcon={<BookOpen className="h-4 w-4" />}
                  ctaLabel="Pick a story"
                  footerLabel="See all 3 of Luca's books"
                  emptyGhost
                />
                <StripCard
                  chipLabel="Library"
                  chipIcon={<BookOpen className="w-3.5 h-3.5 text-white" />}
                  gradient="bg-gradient-to-br from-primary to-[#40916C]"
                  metaLabel="Household shelf"
                  title="Add a new book"
                  progressColor="var(--primary)"
                  progressPct={83}
                  ctaIcon={<Upload className="h-4 w-4" />}
                  ctaLabel="Add a book"
                  footerLabel="See all 12 books"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Library wireframe ── */}
        <div className="mb-10">
          <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-1 text-base">Library — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/library</code></h4>
          <p className="text-xs text-muted-foreground mb-3">Upload row + BookCard Parent grid. No tabs — sibling Readers page reachable via ProfileAvatar.</p>
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <AppHeaderWire showBack right={<UserAvatarCircle />} />
            <div className="p-6">
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

              {/* Book grid using BookCard Parent (harmonized) */}
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { title: "Where the Wild Things Are", author: "Maurice Sendak", status: "Ready", progress: [{ kid: "Fynn", color: "#C56B8A", pct: 67 }, { kid: "Luca", color: "#6B8FD4", pct: 15 }] },
                  { title: "The Dragon and the Star", author: "EmberTales Team", status: "Ready", progress: [{ kid: "Fynn", color: "#C56B8A", pct: 30 }] },
                  { title: "The Gruffalo", author: "Julia Donaldson", status: "Ready", progress: [{ kid: "Luca", color: "#6B8FD4", pct: 25 }] },
                  { title: "gutenberg_cache_27922.txt", author: "Unknown", status: "Processing", progress: [] },
                ].map((book) => (
                  <div key={book.title} className="rounded-xl border border-border bg-card p-4 flex gap-4">
                    <div className="h-24 w-16 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#8B6DAF" }}>
                      <BookOpen className="w-8 h-8 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-[family-name:var(--font-marcellus)] font-semibold truncate">{book.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{book.author} · {book.status}</p>
                        </div>
                        <button className="shrink-0 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                      {book.progress.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {book.progress.map((p) => (
                            <div key={p.kid} className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                              <span className="text-xs text-muted-foreground shrink-0 w-12 truncate">{p.kid}</span>
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{p.pct}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Readers wireframe ── */}
        <div className="mb-10">
          <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-1 text-base">Readers — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/readers</code></h4>
          <p className="text-xs text-muted-foreground mb-3">One panel per kid, each with a ReaderBookRow list. Add-reader CTA at the bottom.</p>
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <AppHeaderWire showBack right={<UserAvatarCircle />} />
            <div className="p-6 space-y-4">
              {/* Fynn panel */}
              {[
                { name: "Fynn", color: "#C56B8A", active: "Today", books: [
                  { title: "Where the Wild Things Are", progress: 67 },
                  { title: "The Dragon and the Star", progress: 30 },
                  { title: "The Gruffalo", progress: 0 },
                ]},
                { name: "Luca", color: "#6B8FD4", active: "2 days ago", books: [
                  { title: "The Gruffalo", progress: 25 },
                ]},
              ].map((kid) => (
                <div key={kid.name} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: kid.color }}>{kid.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-[family-name:var(--font-marcellus)] font-bold text-sm">{kid.name}</h4>
                        <span className="text-xs text-muted-foreground">Last active: {kid.active}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{kid.books.length} {kid.books.length === 1 ? "book" : "books"}</p>
                    </div>
                    <button className="shrink-0 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {kid.books.map((book) => (
                      <div key={book.title} className="rounded-lg bg-secondary/60 px-3 py-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="truncate text-foreground">{book.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{book.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${book.progress}%`, backgroundColor: kid.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add reader */}
              <button className="w-full rounded-xl border-2 border-dashed border-border p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground hover:bg-primary/5 transition-colors">
                <Plus className="w-5 h-5" />
                <span className="text-sm font-semibold">Add a reader</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Kid home wireframe ── */}
        <div className="mb-10">
          <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-1 text-base">Kid home — <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/kid/[kidId]</code></h4>
          <p className="text-xs text-muted-foreground mb-3">One kid&apos;s full library. BookCard Kid grid with harmonized <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">h-44</code> hero — no more elongated <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">aspect-[2/3]</code>.</p>
          <div className="rounded-xl border border-border bg-background overflow-hidden">
            <AppHeaderWire showBack />
            <div className="p-6">
              {/* Kid greeting */}
              <div className="mb-6 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ backgroundColor: "#C56B8A" }}>F</div>
                <div>
                  <h2 className="font-[family-name:var(--font-marcellus)] text-xl font-bold">Hi, Fynn!</h2>
                  <p className="text-sm text-muted-foreground">Pick a story to read</p>
                </div>
              </div>

              {/* BookCard Kid grid */}
              <div className="grid gap-5 md:grid-cols-3">
                {[
                  { title: "Where the Wild Things Are", author: "Maurice Sendak", cover: "#8B6DAF", progress: 67 },
                  { title: "The Dragon and the Star", author: "EmberTales Team", cover: "#2D6A4F", progress: 30 },
                  { title: "The Gruffalo", author: "Julia Donaldson", cover: "#E9A55F", progress: 0 },
                ].map((book) => (
                  <div key={book.title} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="relative h-44 overflow-hidden" style={{ backgroundColor: book.cover }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/40" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow line-clamp-2">{book.title}</p>
                        <p className="text-xs text-white/80 mt-0.5">By {book.author}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${book.progress}%`, backgroundColor: "#C56B8A" }} />
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {book.progress === 0 ? "Ready to start" : `${book.progress}% complete`}
                        </p>
                      </div>
                      <button className="w-full font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-[0_4px_14px] shadow-accent/30">
                        <Play className="h-4 w-4" />
                        {book.progress === 0 ? "Start" : "Continue"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── ProfileAvatar detail (per-page state) ── */}
        <div className="mb-10">
          <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-1 text-base">ProfileAvatar — page-aware menu</h4>
          <p className="text-xs text-muted-foreground mb-3">The row for the current page collapses. Sibling row remains as the 2-click bridge between Library and Readers.</p>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { page: "Home", items: [["Library", BookOpen], ["Manage readers", Users]] },
              { page: "Library (current)", items: [["Manage readers", Users]], collapsed: "Library" },
              { page: "Readers (current)", items: [["Library", BookOpen]], collapsed: "Manage readers" },
            ].map((variant) => (
              <div key={variant.page} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">{variant.page}</p>
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="py-1">
                    {variant.items.map(([label, Icon]) => {
                      const I = Icon as typeof BookOpen
                      return (
                        <div key={label as string} className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground">
                          <I className="w-4 h-4 text-muted-foreground" />
                          <span>{label as string}</span>
                        </div>
                      )
                    })}
                    {variant.collapsed && (
                      <div className="flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground/60 italic">
                        <span className="inline-block w-4" />
                        <span>{variant.collapsed} (hidden — you&apos;re here)</span>
                      </div>
                    )}
                    <div className="border-t border-border my-1" />
                    <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground">
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                      <span>Sign out</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete account</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction notes */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-3">Interaction Notes</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Kid chip on Strip / Kid BookCard cover</strong> — taps to the kid&apos;s home (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/kid/[kidId]</code>).</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Library chip on UploadCard</strong> — taps to <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/library</code>. Same role as the Library row in the ProfileAvatar.</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Amber CTA</strong> — the primary 90% action: Continue/Pick/Add. Always amber, always the visual weight center.</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Footer link</strong> — named escape hatch (&ldquo;See all N of Fynn&apos;s books&rdquo;). Same destination as the chip above.</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Cog / kebab on books (Library)</strong> — dropdown: Edit title/author/cover, Delete book.</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Cog on readers (Readers)</strong> — dropdown: Edit name/color, Delete reader and their progress.</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>ProfileAvatar (top-right)</strong> — click-only (no hover tooltip). The row for the page you&apos;re on collapses to italic muted text so the sibling remains reachable.</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" /><span><strong>Upload row</strong> — click anywhere to browse or drag-drop a PDF onto it.</span></li>
          </ul>
        </div>
      </div>
    </section>
  )
}
