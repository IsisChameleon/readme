'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

const COLOR_OPTIONS = [
  '#E9A55F', '#5CB87A', '#6B8FD4', '#C56B8A', '#8FB56A', '#8B6DAF', '#5BAEC4',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await apiClient.PATCH('/kids/{kid_id}', {
        params: { path: { kid_id: kid.id } },
        body: { name: name.trim(), color },
      });
      if (error) throw new Error('Failed to update');
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
      const { error } = await apiClient.DELETE('/kids/{kid_id}', {
        params: { path: { kid_id: kid.id } },
      });
      if (error) throw new Error('Failed to delete');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-card rounded-xl p-6 w-full max-w-sm mx-4 border border-border shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-[family-name:var(--font-marcellus)] text-xl font-bold mb-4">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 outline-none"
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
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="font-[family-name:var(--font-marcellus)] px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
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
                  className="font-[family-name:var(--font-marcellus)] px-3 py-1.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Keep
                </button>
                <button
                  onClick={handleDelete}
                  disabled={submitting}
                  className="font-[family-name:var(--font-marcellus)] px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50"
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
