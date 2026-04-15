"use client"

import { ColorSwatch, KidColorSwatch, SectionHeader, useDesignTheme } from "../_lib/shared"

export default function OverviewPage() {
  const { isDark } = useDesignTheme()

  return (
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

      {/* Kid Color Palette — part of the visual language */}
      <div className="mb-12">
        <h3 className="font-[family-name:var(--font-marcellus)] mb-2 text-xl font-bold">Kid Color Palette</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Each kid chooses their color during onboarding. These colors also back the book cover placeholders (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">--cover-1&hellip;7</code>).
        </p>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
            <KidColorSwatch name="Firefly" color="#E9A55F" />
            <KidColorSwatch name="Fern" color="#5CB87A" />
            <KidColorSwatch name="Bluebell" color="#6B8FD4" />
            <KidColorSwatch name="Berry" color="#C56B8A" />
            <KidColorSwatch name="Moss" color="#8FB56A" />
            <KidColorSwatch name="Plum" color="#8B6DAF" />
            <KidColorSwatch name="Stream" color="#5BAEC4" />
          </div>
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
  )
}
