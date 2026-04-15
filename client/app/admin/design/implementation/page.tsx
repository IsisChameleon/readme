import { SectionHeader } from "../_lib/shared"

export default function ImplementationPage() {
  return (
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
  )
}
