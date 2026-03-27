'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

const COLOR_OPTIONS = [
  '#F472B6', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#FB923C',
];

interface EditKidDialogProps {
  kid: { id: string; name: string; color: string | null };
  open: boolean;
  onClose: () => void;
}

export const EditKidDialog = ({ kid, open, onClose }: EditKidDialogProps) => {
  const [name, setName] = useState(kid.name);
  const [color, setColor] = useState(kid.color ?? COLOR_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  if (!open) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/kids/${kid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast({ title: 'Updated!' });
      router.refresh();
      onClose();
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/kids/${kid.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: `${kid.name} removed` });
      router.refresh();
      onClose();
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' });
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
        <h2 className="text-lg font-display font-bold mb-4">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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

          {/* Preview */}
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
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        {/* Delete section */}
        <div className="mt-6 pt-4 border-t border-border">
          {showDeleteConfirm ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Remove {kid.name}? This deletes their reading progress.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground"
                >
                  Keep
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-destructive hover:underline"
            >
              Remove profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
