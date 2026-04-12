"use client"

import { useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"

const DRAGON_COUNT = 52

const allDragons = Array.from({ length: DRAGON_COUNT }, (_, i) => {
  const num = String(i + 1).padStart(2, "0")
  return { id: `dragon-${num}`, src: `/images/dragons/dragon-${num}.svg`, label: `Dragon ${i + 1}` }
})

const DragonsPage = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === allDragons.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allDragons.map((d) => d.id)))
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-marcellus)] text-3xl font-bold">
              Dragon Gallery
            </h1>
            <p className="mt-1 text-muted-foreground">
              {selected.size} of {allDragons.length} dragons selected
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={selectAll}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              {selected.size === allDragons.length ? "Deselect All" : "Select All"}
            </button>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {allDragons.map((dragon) => {
            const isSelected = selected.has(dragon.id)
            return (
              <button
                key={dragon.id}
                onClick={() => toggle(dragon.id)}
                className={`group relative flex flex-col items-center rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                {/* Selection indicator */}
                <div
                  className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-background opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                </div>

                {/* Dragon SVG */}
                <div className="flex h-32 w-32 items-center justify-center">
                  <Image
                    src={dragon.src}
                    alt={dragon.label}
                    width={128}
                    height={128}
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* Label */}
                <span className="mt-2 text-xs text-muted-foreground">{dragon.label}</span>
              </button>
            )
          })}
        </div>

        {/* Selected summary */}
        {selected.size > 0 && (
          <div className="mt-8 rounded-xl border border-border bg-muted/50 p-4">
            <h2 className="mb-2 text-sm font-semibold">Selected Dragons</h2>
            <div className="flex flex-wrap gap-2">
              {allDragons
                .filter((d) => selected.has(d.id))
                .map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {d.label}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggle(d.id)
                      }}
                      className="ml-1 hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DragonsPage
