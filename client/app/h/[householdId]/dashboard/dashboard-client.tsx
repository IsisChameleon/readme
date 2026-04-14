'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings, Plus } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { AddKidDialog } from '@/components/AddKidDialog';
import { EditKidDialog } from '@/components/EditKidDialog';
import { BookUpload } from '@/components/BookUpload';
import { BookCard } from '@/components/BookCard';
import { createClient } from '@/lib/supabase/client';

/* ── Types ── */
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

/* ── Main component ── */
export const ParentDashboardClient = ({ householdId, userEmail, userName, kids, books }: Props) => {
  const router = useRouter();
  const [tab, setTab] = useState<'library' | 'readers'>('library');
  const [showAddKid, setShowAddKid] = useState(false);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);

  const handleDeleteBook = async (bookId: string) => {
    const supabase = createClient();
    await supabase.from('books').update({ status: 'deleted' }).eq('id', bookId);
    router.refresh();
  };

  const kidMap = new Map(kids.map((k) => [k.id, k]));

  const tabs = (
    <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
      <button
        onClick={() => setTab('library')}
        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
          tab === 'library'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Library
      </button>
      <button
        onClick={() => setTab('readers')}
        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
          tab === 'readers'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Readers
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        backHref={`/h/${householdId}`}
        right={<ProfileAvatar userName={userName} userEmail={userEmail} householdId={householdId} />}
      />
      {tabs}

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {tab === 'library' ? (
          <LibraryTab
            householdId={householdId}
            books={books}
            kidMap={kidMap}
            onDeleteBook={handleDeleteBook}
          />
        ) : (
          <ReadersTab
            householdId={householdId}
            kids={kids}
            books={books}
            onAddKid={() => setShowAddKid(true)}
            onEditKid={(kid) => setEditingKid(kid)}
          />
        )}
      </main>

      <AddKidDialog householdId={householdId} open={showAddKid} onClose={() => setShowAddKid(false)} />
      {editingKid && (
        <EditKidDialog kid={editingKid} open={!!editingKid} onClose={() => setEditingKid(null)} />
      )}
    </div>
  );
};

/* ── Library Tab ── */
const LibraryTab = ({
  householdId,
  books,
  kidMap,
  onDeleteBook,
}: {
  householdId: string;
  books: Book[];
  kidMap: Map<string, Kid>;
  onDeleteBook: (bookId: string) => void;
}) => (
  <div className="space-y-6">
    {/* Compact upload row */}
    <BookUpload householdId={householdId} compact />

    {/* Book list — uses the parent BookCard variant (includes rename + delete) */}
    <div className="space-y-3">
      {books.map((book, index) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index }}
        >
          <BookCard
            variant="parent"
            book={{
              id: book.id,
              title: book.title,
              author: book.author,
              status: book.status,
              coverImageUrl: book.cover_image_url,
            }}
            kidProgress={book.kidProgress
              .map(({ kidId, progress }) => {
                const kid = kidMap.get(kidId);
                if (!kid) return null;
                return {
                  kidId,
                  kidName: kid.name,
                  kidColor: kid.color ?? '#5CB87A',
                  progress,
                };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null)}
            onDelete={onDeleteBook}
          />
        </motion.div>
      ))}
    </div>

    {books.length === 0 && (
      <p className="text-center text-muted-foreground py-12">
        No books yet. Upload a PDF to get started.
      </p>
    )}
  </div>
);

/* ── Readers Tab ── */
const ReadersTab = ({
  householdId: _householdId,
  kids,
  books,
  onAddKid,
  onEditKid,
}: {
  householdId: string;
  kids: Kid[];
  books: Book[];
  onAddKid: () => void;
  onEditKid: (kid: Kid) => void;
}) => {
  const kidBooks = (kidId: string) =>
    books
      .filter((b) => b.kidProgress.some((kp) => kp.kidId === kidId))
      .map((b) => ({
        title: b.title,
        progress: b.kidProgress.find((kp) => kp.kidId === kidId)?.progress ?? 0,
      }));

  const lastActive = (kidId: string) => {
    const booksWithProgress = books.filter((b) => b.kidProgress.some((kp) => kp.kidId === kidId));
    return booksWithProgress.length === 0 ? 'Never' : 'Recently';
  };

  return (
    <div className="space-y-4">
      {kids.map((kid, index) => {
        const kidBookList = kidBooks(kid.id);
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
                <span className="text-xs text-muted-foreground">Last active: {lastActive(kid.id)}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {kidBookList.length} {kidBookList.length === 1 ? 'book' : 'books'}
              </p>
              {kidBookList.length > 0 ? (
                <div className="space-y-2">
                  {kidBookList.map((book) => (
                    <div key={book.title} className="rounded-lg bg-secondary/50 p-2.5">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate text-muted-foreground">{book.title}</span>
                        <span className="font-semibold text-foreground shrink-0 ml-2">{book.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${book.progress}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No reading activity yet</p>
              )}
            </div>
            <button
              onClick={() => onEditKid(kid)}
              className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
              aria-label={`Edit ${kid.name}`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })}

      <button
        onClick={onAddKid}
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
    </div>
  );
};
