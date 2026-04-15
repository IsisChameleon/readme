import { ArrowLeft, BookOpen, ChevronRight, LogOut, Play, Plus, Trash2, Upload, Users } from "lucide-react"
import { EmberLogo } from "@/components/EmberLogo"
import { SectionHeader } from "../_lib/shared"

// Wireframe for a full-height header strip matching admin/design anatomy.
// size=40 logo, text-2xl title, subtitle beneath, py-4 vertical.
function HeaderShell({
  showBack,
  center,
  right,
}: {
  showBack?: boolean
  center?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          {showBack && (
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </div>
          )}
          <EmberLogo size={40} className="text-primary shrink-0" />
          <div>
            <h3 className="font-[family-name:var(--font-marcellus)] text-2xl font-bold text-foreground leading-tight">EmberTales</h3>
            <p className="text-sm text-muted-foreground">Stories, read together</p>
          </div>
        </div>
        {center && <div className="flex-1 flex items-center justify-center">{center}</div>}
        {!center && <div className="flex-1" />}
        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </div>
  )
}

// Small kid-color circle (40px — matches profile avatar size from Candidate A).
function KidCircle({ color, initial }: { color: string; initial: string }) {
  return (
    <div
      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  )
}

// 40px user profile avatar — primary ring.
function UserAvatarCircle() {
  return (
    <button className="h-10 w-10 rounded-full ring-[3px] ring-primary/50 bg-[#5CB87A] flex items-center justify-center text-sm font-bold text-white">
      I
    </button>
  )
}

// Dark tooltip pill (Google-style).
function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-md bg-foreground text-background px-2.5 py-1 text-xs font-medium shadow-lg">
      {children}
    </div>
  )
}

export default function HeadersPage() {
  return (
    <section className="mb-20">
      <SectionHeader
        title="Header Patterns"
        subtitle="The cross-app AppHeader, ProfileAvatar popover, and three candidate treatments for kid quick-nav."
      />

      {/* ── 2.1 AppHeader — three variants ── */}
      <div className="mb-16">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-2 text-xl font-bold">AppHeader — variants by surface</h3>
        <p className="text-sm text-muted-foreground mb-6">
          One shared shell, three slot fillings. Shared anatomy matches this very page&apos;s header: <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">EmberLogo size=40</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">text-2xl</code> title, muted subtitle underneath, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">py-4</code>, sticky with backdrop-blur.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Home variant */}
          <div>
            <HeaderShell
              right={<UserAvatarCircle />}
            />
            <p className="mt-3 text-sm font-medium">Home</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]</code> — no back arrow. Right slot: ProfileAvatar only. Per-kid nav happens on the KidCards themselves (see &sect; KidCard double duty).
            </p>
          </div>

          {/* Kid-home variant */}
          <div>
            <HeaderShell showBack />
            <p className="mt-3 text-sm font-medium">Kid home</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/kid/[kidId]</code> — back arrow only. Kid-facing: no center, no profile menu.
            </p>
          </div>

          {/* Library variant */}
          <div>
            <HeaderShell showBack right={<UserAvatarCircle />} />
            <p className="mt-3 text-sm font-medium">Library</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/library</code> — parent&apos;s household book library. Back to Home, ProfileAvatar right (its menu collapses <em>Library</em>, leaves <em>Manage readers</em> as the cross-link to the sibling page).
            </p>
          </div>

          {/* Readers variant */}
          <div>
            <HeaderShell showBack right={<UserAvatarCircle />} />
            <p className="mt-3 text-sm font-medium">Readers</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[householdId]/readers</code> — parent&apos;s view of each kid&apos;s progress. Same chrome as Library; ProfileAvatar menu collapses <em>Manage readers</em> and leaves <em>Library</em>.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Always:</strong> dragon + EmberTales wordmark + subtitle on the left. The center and right slots are the only parts that change.
          </p>
          <p>
            <strong className="text-foreground">Footer removed:</strong> the old &ldquo;Stories, read together&rdquo; footer on the home page goes away. That line lives as the header subtitle now, so it appears on every page under the wordmark — same role admin/design&apos;s &ldquo;Enchanted Forest Style Guide&rdquo; plays here.
          </p>
        </div>
      </div>

      {/* ── 2.2 ProfileAvatar popover ── */}
      <div className="mb-16">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-2 text-xl font-bold">ProfileAvatar — popover menu</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Click-only interaction (matches Google&apos;s account menu). No hover tooltip on the avatar itself — tooltip would be redundant with the popover below.
        </p>

        <div className="rounded-xl border border-border bg-background p-8 relative flex justify-end min-h-[380px]">
          {/* The avatar */}
          <div className="relative">
            <UserAvatarCircle />

            {/* Open popover */}
            <div className="absolute right-0 top-12 w-72 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="p-4 text-center border-b border-border">
                <div className="h-16 w-16 rounded-full bg-[#5CB87A] flex items-center justify-center text-2xl font-bold text-white mx-auto ring-[3px] ring-primary/40">I</div>
                <p className="font-[family-name:var(--font-marcellus)] font-bold mt-2">Hi, Isabelle!</p>
                <p className="text-xs text-muted-foreground">isabelle@example.com</p>
              </div>
              <div className="py-1">
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>Library</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>Manage readers</span>
                </div>
                <div className="border-t border-border my-1" />
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                  <span>Sign out</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete account</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Two groups separated by a divider. <strong>Top group:</strong> <strong>Library</strong> (BookOpen) → <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/library</code>, <strong>Manage readers</strong> (Users) → <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/readers</code>. These are two independent pages, not tabs. <strong>Bottom group:</strong> <strong>Sign out</strong> and <strong>Delete account</strong>. The row for the page you&apos;re currently on collapses — so on Library only <em>Manage readers</em> shows, on Readers only <em>Library</em> shows. On Home both show.
        </p>
      </div>

      {/* ── 2.3 Kid quick-nav candidates ── */}
      <div className="mb-16">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-2 text-xl font-bold">Kid quick-nav — three candidates</h3>
        <p className="text-sm text-muted-foreground mb-6">
          How should the home header expose per-kid navigation? Three options, no recommendation — pick what feels right.
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Candidate A — Circles + tooltip */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Candidate A</p>
            <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-3">Unified circles with tooltip</h4>

            {/* Detail */}
            <div className="flex items-center gap-2 mb-2">
              <div className="relative">
                <KidCircle color="#E9A55F" initial="F" />
                <div className="absolute left-1/2 -translate-x-1/2 top-12 whitespace-nowrap">
                  <Tooltip>Fynn&apos;s books</Tooltip>
                </div>
              </div>
              <KidCircle color="#6B8FD4" initial="L" />
            </div>
            <p className="text-xs text-muted-foreground mt-8 mb-4">
              Kid circles sized <strong>40 px</strong> to match the user avatar. On hover, a dark pill tooltip &ldquo;Fynn&apos;s books&rdquo;.
            </p>

            {/* In-context preview */}
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">In header</p>
              <HeaderShell
                right={
                  <>
                    <KidCircle color="#E9A55F" initial="F" />
                    <KidCircle color="#6B8FD4" initial="L" />
                    <UserAvatarCircle />
                  </>
                }
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Same dark tooltip style as the user avatar popover header.</p>
          </div>

          {/* Candidate B — Pill segmented */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Candidate B</p>
            <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-3">Pill segmented control</h4>

            {/* Detail */}
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 w-fit mb-4">
              <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Fynn</span>
              <span className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground">Luca</span>
              <span className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground">
                <Plus className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Replaces circles with labelled pills. Trailing <strong>+</strong> adds a reader.
            </p>

            {/* In-context preview */}
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">In header</p>
              <HeaderShell
                right={
                  <>
                    <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
                      <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Fynn</span>
                      <span className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground">Luca</span>
                      <span className="h-6 w-6 rounded-lg flex items-center justify-center text-muted-foreground">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <UserAvatarCircle />
                  </>
                }
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Echoes the Books/Readers toggle. More horizontal space — may wrap on mobile.</p>
          </div>

          {/* Candidate C — Drop from header */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Candidate C</p>
            <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-3">Drop kid nav from header</h4>

            {/* Detail — just a note */}
            <p className="text-xs text-muted-foreground mb-4">
              Header reduces to dragon + wordmark (left) and ProfileAvatar (right). Kid entry is only via tapping the kid tile on the page body.
            </p>

            {/* In-context preview */}
            <div className="rounded-lg border border-border/60 bg-background p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">In header</p>
              <HeaderShell right={<UserAvatarCircle />} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Cleanest header. Kid tiles on the body become the single nav surface.</p>
          </div>
        </div>
      </div>

      {/* ── 2.4 KidCard double-duty — where full kid-library nav goes if header drops circles ── */}
      <div className="mb-16">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-2 text-xl font-bold">
          KidCard double duty — if the header drops kid nav
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Candidate C above removes kid circles from the header. That only works if kids can still reach their full library in one tap somewhere else. Proposal: let the KidCard carry two explicit affordances instead of one ambiguous whole-card tap.
        </p>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* The proposed KidCard */}
          <div className="relative">
            <div className="rounded-2xl border border-border bg-card overflow-hidden max-w-sm">
              {/* Book cover hero */}
              <div className="relative h-40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#C56B8A] to-[#8B6DAF]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Tap zone 1: kid chip → Fynn's library */}
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30 hover:ring-white/60 cursor-pointer transition-all">
                    <div className="h-7 w-7 rounded-full bg-[#C56B8A] flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/80">
                      F
                    </div>
                    <span className="text-xs font-semibold text-white">Fynn</span>
                    <ChevronRight className="w-3 h-3 text-white/80" />
                  </div>
                </div>

                {/* Book title on cover */}
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-xs text-white/70 mb-0.5">Reading now</p>
                  <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow">
                    Where the Wild Things Are
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Progress */}
                <div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-2/3 rounded-full bg-[#C56B8A]" />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">67% complete · Chapter 8 of 12</p>
                </div>

                {/* Tap zone 2: big amber CTA → start voice session on last book */}
                <button className="w-full font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground cursor-pointer hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 transition-all">
                  <Play className="h-4 w-4" />
                  Continue reading
                </button>

                {/* Tap zone 3: secondary link → Fynn's library */}
                <button className="w-full flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground hover:bg-secondary cursor-pointer transition-colors">
                  <span>See all 8 of Fynn&apos;s books</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* Annotations */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <div>
                  <p className="font-semibold text-sm">Kid chip (top-left of cover)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Tap →</strong> <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/h/[id]/kid/[kidId]</code>. Chevron + ring on hover make the &ldquo;tappable&rdquo; explicit. Uses the kid&apos;s own color for identity.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-6 w-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div>
                  <p className="font-semibold text-sm">&ldquo;Continue reading&rdquo; (amber CTA)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Tap →</strong> starts the voice session on the last book. Visually dominant (80% of the card&apos;s weight) so this is the obvious primary action — what you do 90% of the time.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-6 w-6 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <div>
                  <p className="font-semibold text-sm">&ldquo;See all N books&rdquo; (footer link)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Tap →</strong> same destination as zone 1 (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">/kid/[kidId]</code>). Subtle but discoverable, and names the escape hatch in plain language — &ldquo;this card is about the last book, but there&apos;s more here.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Net effect:</strong> pairs with Candidate C (header drops kid circles). Parents reach books and readers via the <strong>Library</strong> and <strong>Manage readers</strong> items in the ProfileAvatar popover. Kids reach their full library via the card, one tap. No header clutter, no hidden destinations.
              </p>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-destructive">Risk:</strong> two tap targets on one card needs clear hierarchy so a kid doesn&apos;t mis-tap zones 1 or 3 when they meant to hit zone 2. Mitigated by the amber CTA&apos;s visual weight and the footer link&apos;s quieter secondary-background styling — but worth live-testing with Fynn &amp; Luca before shipping.
              </p>
            </div>
          </div>
        </div>

        {/* Strip companions — same skeleton, different verb */}
        <div className="mt-10">
          <h4 className="font-[family-name:var(--font-marcellus)] font-bold mb-2 text-base">Strip companions — one skeleton, three verbs</h4>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            All three cards share the exact same anatomy so they line up cleanly in a horizontal strip: <strong>chip</strong> (top-left of cover), <strong>hero</strong> (h-40, gradient, title overlay), <strong>meta row</strong> (progress or count), <strong>amber primary CTA</strong>, and <strong>secondary footer link</strong>. Only the copy and the destination change.
          </p>

          <div className="grid gap-4 lg:grid-cols-3 items-start">
            {/* Populated — repeat for reference so all three sit side-by-side */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Populated (last book)</p>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#C56B8A] to-[#8B6DAF]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30">
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
            </div>

            {/* Empty-state variant — aligned to populated dimensions */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Empty (no last book)</p>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
                    {/* Ghost progress row — same vertical footprint, different semantics */}
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
            </div>

            {/* UploadCard — parent affordance in the same skeleton */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Parent upload</p>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-[#40916C]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Library chip (parent-colored, not kid) */}
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30 hover:ring-white/60 cursor-pointer transition-all">
                      <div className="h-7 w-7 rounded-full bg-background/20 flex items-center justify-center ring-2 ring-white/80">
                        <BookOpen className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white">Library</span>
                      <ChevronRight className="w-3 h-3 text-white/80" />
                    </div>
                  </div>
                  {/* Decorative stack of book silhouettes */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-xs text-white/70 mb-0.5">Household shelf</p>
                    <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow">Add a new book</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    {/* Status meta: counts, matches progress row footprint */}
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
          </div>

          <div className="mt-6 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">Strip rhythm:</strong> every card in the home strip has the same anatomy. Same height, same CTA position, same footer-link position. The only things that change are the gradient, the chip identity (kid vs Library), the verb (&ldquo;Continue&rdquo; / &ldquo;Pick&rdquo; / &ldquo;Add&rdquo;), and the destination.
            </p>
            <p>
              <strong className="text-foreground">Nav coverage without header circles:</strong> kid library → kid chip <em>or</em> kid-card footer. Parent library → Library chip on UploadCard <em>or</em> &ldquo;Library&rdquo; row in ProfileAvatar. Readers/stats → &ldquo;Manage readers&rdquo; row in ProfileAvatar. Three destinations, two surfaces each, no header clutter.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2.5 Anti-pattern callout ── */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex items-start gap-3">
        <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-destructive">Don&apos;t</strong> combine a hover tooltip <em>and</em> a click popover on the same avatar — pick one interaction per element. The current live ProfileAvatar has both; the new design keeps only the click popover.
        </p>
      </div>
    </section>
  )
}
