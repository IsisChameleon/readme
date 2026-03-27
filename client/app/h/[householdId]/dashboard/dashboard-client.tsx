'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { KidSelector } from '@/components/KidSelector';
import { AddKidDialog } from '@/components/AddKidDialog';
import { EditKidDialog } from '@/components/EditKidDialog';
import { BookCard } from '@/components/BookCard';
import { BookUpload } from '@/components/BookUpload';
import { SignOutButton } from '@/components/SignOutButton';
import { createClient } from '@/lib/supabase/client';

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

interface ParentDashboardClientProps {
  householdId: string;
  kids: Kid[];
  books: Book[];
}

export const ParentDashboardClient = ({
  householdId,
  kids,
  books,
}: ParentDashboardClientProps) => {
  const router = useRouter();
  const [showAddKid, setShowAddKid] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);

  const handleDeleteBook = async (bookId: string) => {
    const supabase = createClient();
    await supabase.from('books').update({ status: 'deleted' }).eq('id', bookId);
    router.refresh();
  };

  // Build a kid color/name lookup
  const kidMap = new Map(kids.map((k) => [k.id, k]));

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/h/${householdId}`)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground">EmberTales</h1>
                <p className="text-sm text-muted-foreground">Settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Readers */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Readers</h2>
          <KidSelector
            kids={kids}
            onSelectKid={() => {}}
            onAddKid={() => setShowAddKid(true)}
            onEditKid={(kid) => setEditingKid(kid)}
          />
        </section>

        {/* Library */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Library</h2>

          <div className="max-w-2xl">
            <BookUpload householdId={householdId} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="space-y-2"
              >
                <BookCard
                  book={{
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    status: book.status,
                    coverImageUrl: book.cover_image_url,
                  }}
                  variant="parent"
                  onDelete={handleDeleteBook}
                />
                {/* Per-kid reading progress */}
                {book.kidProgress.length > 0 && (
                  <div className="flex flex-col gap-1.5 px-3">
                    {book.kidProgress.map(({ kidId, progress }) => {
                      const kid = kidMap.get(kidId);
                      if (!kid) return null;
                      return (
                        <div key={kidId} className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: kid.color ?? '#60A5FA' }}
                            title={kid.name}
                          >
                            {kid.avatar ?? kid.name[0]?.toUpperCase()}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: kid.color ?? '#60A5FA',
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{progress}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}
            {books.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No books yet. Drop a PDF above to get started.
              </p>
            )}
          </div>
        </section>
      </div>

      <AddKidDialog householdId={householdId} open={showAddKid} onClose={() => setShowAddKid(false)} />
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
