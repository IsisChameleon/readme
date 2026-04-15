'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';

const COLOR_OPTIONS = [
  '#E9A55F', '#5CB87A', '#6B8FD4', '#C56B8A', '#8FB56A', '#8B6DAF', '#5BAEC4',
];

interface AddKidDialogProps {
  householdId: string;
  open: boolean;
  onClose: () => void;
}

export const AddKidDialog = ({ householdId, open, onClose }: AddKidDialogProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await apiClient.POST('/kids', {
        body: {
          household_id: householdId,
          name: name.trim(),
          avatar: name.trim()[0].toUpperCase(),
          color,
        },
      });
      if (error) throw new Error('Failed to create kid');

      toast({ title: `${name.trim()} added!` });
      router.refresh();
      onClose();
      setName('');
    } catch {
      toast({ title: 'Failed to add kid', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-card rounded-xl p-6 w-full max-w-sm mx-4 border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-4">Add a Reader</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none"
              placeholder="Enter name"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {name.trim() && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: color }}
              >
                {name.trim()[0].toUpperCase()}
              </span>
              <span className="font-semibold">{name.trim()}</span>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {submitting ? 'Adding\u2026' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
