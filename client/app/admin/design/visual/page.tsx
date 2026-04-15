import { SectionHeader } from "../_lib/shared"

export default function VisualPage() {
  return (
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
  )
}
