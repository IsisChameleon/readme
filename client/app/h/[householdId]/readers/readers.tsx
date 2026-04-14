'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { AddKidDialog } from '@/components/AddKidDialog';
import { EditKidDialog } from '@/components/EditKidDialog';
import { ReaderBookRow } from '@/components/ReaderBookRow';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface KidProgress {
  kidId: string;
  progress: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  cover_image_url: string | null;
  created_at: string;
  kidProgress: KidProgress[];
}

interface Props {
  householdId: string;
  userEmail: string;
  userName: string;
  kids: Kid[];
  books: Book[];
}

export const Readers = ({ householdId, userEmail, userName, kids, books }: Props) => {
  const [showAddKid, setShowAddKid] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);

  const kidBooks = (kidId: string) =>
    books
      .filter((b) => b.kidProgress.some((kp) => kp.kidId === kidId))
      .map((b) => ({
        title: b.title,
        progress: b.kidProgress.find((kp) => kp.kidId === kidId)?.progress ?? 0,
      }));

  const lastActive = (kidId: string) => {
    const has = books.some((b) => b.kidProgress.some((kp) => kp.kidId === kidId));
    return has ? 'Recently' : 'Never';
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        backHref={`/h/${householdId}`}
        right={
          <ProfileAvatar
            userName={userName}
            userEmail={userEmail}
            householdId={householdId}
            currentPath="readers"
          />
        }
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
        {kids.map((kid, index) => {
          const list = kidBooks(kid.id);
          const color = kid.color ?? '#5CB87A';

          return (
            <motion.div
              key={kid.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              className="rounded-xl border border-border bg-card p-4 flex items-start gap-4"
            >
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                {kid.avatar ?? kid.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-[family-name:var(--font-marcellus)] font-bold">{kid.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    Last active: {lastActive(kid.id)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {list.length} {list.length === 1 ? 'book' : 'books'}
                </p>
                {list.length > 0 ? (
                  <div className="space-y-2">
                    {list.map((book) => (
                      <ReaderBookRow
                        key={book.title}
                        title={book.title}
                        progress={book.progress}
                        kidColor={color}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No reading activity yet</p>
                )}
              </div>
              <button
                onClick={() => setEditingKid(kid)}
                className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
                aria-label={`Edit ${kid.name}`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}

        <button
          onClick={() => setShowAddKid(true)}
          className="w-full rounded-xl border-2 border-dashed border-border p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground hover:bg-primary/5 cursor-pointer transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-semibold">Add a reader</span>
        </button>

        {kids.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No readers yet. Add one to get started.
          </p>
        )}
      </main>

      <AddKidDialog
        householdId={householdId}
        open={showAddKid}
        onClose={() => setShowAddKid(false)}
      />
      {editingKid && (
        <EditKidDialog
          kid={editingKid}
          open={!!editingKid}
          onClose={() => setEditingKid(null)}
        />
      )}
    </div>
  );
};
