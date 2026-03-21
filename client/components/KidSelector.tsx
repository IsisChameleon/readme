"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { motion } from "framer-motion"

interface Kid {
  id: string
  name: string
  avatar: string | null
  color: string | null
}

interface KidSelectorProps {
  kids: Kid[]
  selectedKidId?: string
  onSelectKid: (kidId: string) => void
  onAddKid?: () => void
}

export function KidSelector({ kids, selectedKidId, onSelectKid, onAddKid }: KidSelectorProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {kids.map((kid) => (
        <motion.button
          key={kid.id}
          onClick={() => onSelectKid(kid.id)}
          className="flex flex-col items-center gap-2 min-w-fit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Avatar
            className={`w-16 h-16 border-4 transition-colors ${
              selectedKidId === kid.id ? 'border-primary shadow-lg' : 'border-transparent'
            }`}
            style={{ backgroundColor: kid.color ?? '#60A5FA' }}
          >
            <AvatarFallback
              className="text-2xl font-display text-white"
              style={{ backgroundColor: kid.color ?? '#60A5FA' }}
            >
              {kid.avatar ?? kid.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={`text-sm font-medium transition-colors ${
            selectedKidId === kid.id ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {kid.name}
          </span>
        </motion.button>
      ))}

      {onAddKid && (
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-dashed"
          onClick={onAddKid}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}
