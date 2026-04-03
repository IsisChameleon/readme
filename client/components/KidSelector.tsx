'use client';

import { Plus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface KidSelectorProps {
  kids: Kid[];
  selectedKidId?: string;
  onSelectKid: (kidId: string) => void;
  onAddKid?: () => void;
  onEditKid?: (kid: Kid) => void;
}

export const KidSelector = ({ kids, selectedKidId, onSelectKid, onAddKid, onEditKid }: KidSelectorProps) => {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2">
      {kids.map((kid) => (
        <motion.div
          key={kid.id}
          className="flex flex-col items-center gap-2 min-w-fit relative group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => onSelectKid(kid.id)}
            className="relative"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-colors ${
                selectedKidId === kid.id ? 'border-primary shadow-lg' : 'border-transparent'
              }`}
              style={{ backgroundColor: kid.color ?? '#60A5FA' }}
            >
              <span className="text-2xl font-display text-white">
                {kid.avatar ?? kid.name[0]?.toUpperCase()}
              </span>
            </div>
          </button>

          {/* Edit icon — appears on hover */}
          {onEditKid && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditKid(kid); }}
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
          )}

          <span className={`text-sm font-medium transition-colors ${
            selectedKidId === kid.id ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {kid.name}
          </span>
        </motion.div>
      ))}

      {onAddKid && (
        <div className="flex flex-col items-center gap-2 min-w-fit">
          <button
            onClick={onAddKid}
            className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Add</span>
        </div>
      )}
    </div>
  );
};
