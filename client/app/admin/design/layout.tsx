"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import { EmberLogo } from "@/components/EmberLogo"
import { DesignThemeProvider } from "./_lib/shared"

const sections = [
  { slug: "overview", label: "Overview" },
  { slug: "visual", label: "Visual Language" },
  { slug: "primitives", label: "Core Primitives" },
  { slug: "headers", label: "Headers" },
  { slug: "components", label: "Feature Components" },
  { slug: "pages", label: "Page Patterns" },
  { slug: "implementation", label: "Implementation" },
] as const

export default function DesignLayout({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()

  const activeSlug = pathname?.split("/admin/design/")[1]?.split("/")[0] ?? "overview"

  return (
    <DesignThemeProvider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      <div className={isDark ? "dark" : ""}>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
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
                    <Link
                      key={s.slug}
                      href={`/admin/design/${s.slug}`}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        activeSlug === s.slug
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {s.label}
                    </Link>
                  ))}
                </nav>
                <button
                  onClick={() => setIsDark((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-secondary/80"
                  aria-label="Toggle dark mode"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-6 py-12">{children}</main>
        </div>
      </div>
    </DesignThemeProvider>
  )
}
