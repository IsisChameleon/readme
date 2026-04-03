'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getAccessToken } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';

const COLOR_OPTIONS = [
  '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C',
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
      const token = await getAccessToken();
      const { error } = await apiClient.POST('/kids', {
        params: { header: { authorization: `Bearer ${token}` } },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-2xl p-6 w-full max-w-sm mx-4 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-display font-bold mb-4">Add a Kid</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
