"use client"

import { ChevronRight } from "lucide-react"
import { createContext, useContext, type ReactNode } from "react"

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h2 className="font-[family-name:var(--font-marcellus)] text-3xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export function ColorSwatch({
  name,
  color,
  darkColor,
  isDark,
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

export function KidColorSwatch({ name, color }: { name: string; color: string }) {
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

export function PagePatternCard({ title, items, dark }: { title: string; items: string[]; dark?: boolean }) {
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

export function DragonIcon({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
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

interface DesignThemeValue {
  isDark: boolean
  toggle: () => void
}

const DesignThemeContext = createContext<DesignThemeValue | null>(null)

export const DesignThemeProvider = ({ value, children }: { value: DesignThemeValue; children: ReactNode }) => (
  <DesignThemeContext.Provider value={value}>{children}</DesignThemeContext.Provider>
)

export const useDesignTheme = (): DesignThemeValue => {
  const ctx = useContext(DesignThemeContext)
  if (!ctx) throw new Error("useDesignTheme must be used inside DesignThemeProvider")
  return ctx
}
