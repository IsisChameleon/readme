'use client';

import { Plus } from 'lucide-react';
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
}

export const KidSelector = ({ kids, selectedKidId, onSelectKid, onAddKid }: KidSelectorProps) => {
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
          <span className={`text-sm font-medium transition-colors ${
            selectedKidId === kid.id ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {kid.name}
          </span>
        </motion.button>
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
