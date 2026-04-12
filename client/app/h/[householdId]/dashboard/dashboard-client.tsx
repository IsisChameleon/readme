'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Plus, BookOpen, LogOut, Trash2 } from 'lucide-react';
import { EmberLogo } from '@/components/EmberLogo';
import { AddKidDialog } from '@/components/AddKidDialog';
import { EditKidDialog } from '@/components/EditKidDialog';
import { BookUpload } from '@/components/BookUpload';
import { createClient } from '@/lib/supabase/client';

/* ── Woodland palette for cover placeholders ── */
const PALETTE = ['#E9A55F', '#5CB87A', '#6B8FD4', '#C56B8A', '#8FB56A', '#8B6DAF', '#5BAEC4'];
const colorFromString = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleDeleteBook = async (bookId: string) => {
    const supabase = createClient();
    await supabase.from('books').update({ status: 'deleted' }).eq('id', bookId);
    router.refresh();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  // Close profile popover on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const kidMap = new Map(kids.map((k) => [k.id, k]));
  const userInitial = userName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="min-h-dvh bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: back + logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/h/${householdId}`)}
                className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <EmberLogo size={32} className="text-primary" />
              <span className="font-[family-name:var(--font-marcellus)] font-bold text-lg hidden sm:block">EmberTales</span>
            </div>

            {/* Center: tab bar */}
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
              <button
                onClick={() => setTab('library')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === 'library'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setTab('readers')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === 'readers'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Readers
              </button>
            </div>

            {/* Right: profile avatar */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="group relative h-10 w-10 rounded-full ring-[3px] ring-primary/50 hover:ring-primary transition-all bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground cursor-pointer"
                title={userName}
              >
                {userInitial}
                {/* Hover tooltip */}
                <div className="absolute right-0 top-12 w-56 rounded-lg bg-foreground text-background px-3 py-2 text-xs shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30">
                  <p className="font-semibold">{userName}</p>
                  <p className="text-background/70">{userEmail}</p>
                </div>
              </button>

              {/* Click popover */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-14 w-72 rounded-xl border border-border bg-card shadow-lg z-30 overflow-hidden"
                  >
                    <div className="p-4 text-center border-b border-border">
                      <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto ring-[3px] ring-primary/20">
                        {userInitial}
                      </div>
                      <p className="font-[family-name:var(--font-marcellus)] font-bold mt-2">Hi, {userName.split(' ')[0]}!</p>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                        onClick={() => { /* TODO: delete account flow */ }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete account
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab content ── */}
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

      {/* Dialogs */}
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

    {/* Book grid */}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book, index) => (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index }}
        >
          <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors">
            {/* Cover */}
            <div
              className="h-32 flex flex-col items-center justify-center p-3 text-center"
              style={{ backgroundColor: book.cover_image_url ? undefined : colorFromString(book.title) }}
            >
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <>
                  <BookOpen className="w-6 h-6 text-white/40 mb-1" />
                  <p className="text-white/90 text-xs font-bold leading-tight line-clamp-2">{book.title}</p>
                </>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="font-[family-name:var(--font-marcellus)] font-semibold text-sm truncate">{book.title}</p>
              <p className="text-xs text-muted-foreground truncate">{book.author}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  book.status === 'ready'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent'
                }`}>
                  {book.status === 'ready' ? 'Ready' : book.status === 'processing' ? 'Processing' : book.status}
                </span>
                <BookCardMenu bookId={book.id} onDelete={onDeleteBook} />
              </div>
              {/* Per-kid progress */}
              {book.kidProgress.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border space-y-1">
                  {book.kidProgress.map(({ kidId, progress }) => {
                    const kid = kidMap.get(kidId);
                    if (!kid) return null;
                    return (
                      <div key={kidId} className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                          style={{ backgroundColor: kid.color ?? '#5CB87A' }}
                        >
                          {kid.name[0]}
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${progress}%`, backgroundColor: kid.color ?? '#5CB87A' }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-6 text-right">{progress}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
  // Build per-kid book progress from the books array
  const kidBooks = (kidId: string) =>
    books
      .filter((b) => b.kidProgress.some((kp) => kp.kidId === kidId))
      .map((b) => ({
        title: b.title,
        progress: b.kidProgress.find((kp) => kp.kidId === kidId)?.progress ?? 0,
      }));

  // Find last active (most recently created book with progress)
  const lastActive = (kidId: string) => {
    const booksWithProgress = books.filter((b) => b.kidProgress.some((kp) => kp.kidId === kidId));
    if (booksWithProgress.length === 0) return 'Never';
    return 'Recently';
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
            >
              <Settings className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })}

      {/* Add reader */}
      <button
        onClick={onAddKid}
        className="w-full rounded-xl border-2 border-dashed border-border p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-foreground hover:bg-primary/5 transition-colors"
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

/* ── Book card menu (settings cog with dropdown) ── */
const BookCardMenu = ({ bookId, onDelete }: { bookId: string; onDelete: (id: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="h-6 w-6 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        <Settings className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
          <button
            onClick={() => { setOpen(false); onDelete(bookId); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
