'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Mic, Trash2, PencilLine, MoreVertical } from 'lucide-react';
import { getCoverColor } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface Book {
  id: string;
  title: string;
  author?: string | null;
  status: string;
  coverImageUrl?: string | null;
  progress?: number;
}

interface KidProgressEntry {
  kidId: string;
  kidName: string;
  kidColor: string;
  progress: number;
}

interface BookCardProps {
  book: Book;
  variant?: 'parent' | 'reader';
  kidProgress?: KidProgressEntry[];
  onStartReading?: (bookId: string) => void;
  onDelete?: (bookId: string) => void;
}

export const BookCard = ({
  book,
  variant = 'reader',
  kidProgress,
  onStartReading,
  onDelete,
}: BookCardProps) => {
  const progress = book.progress ?? 0;
  const coverColor = getCoverColor(book.id);

  const buttonLabel =
    progress === 100 ? 'Read Again' : progress > 0 ? 'Continue' : 'Start Reading';

  if (variant === 'reader') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden cursor-pointer touch-manipulation transition-all hover:border-primary"
        onClick={() => book.status === 'ready' && onStartReading?.(book.id)}
      >
        {/* Hero cover with overlay */}
        <div
          className="relative h-44 overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
        >
          {book.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <BookOpen className="w-16 h-16 text-white/80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white drop-shadow line-clamp-2">
              {book.title}
            </h3>
            {book.author && (
              <p className="text-xs text-white/80 truncate">{book.author}</p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {progress > 0 && progress < 100 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {progress === 100 && (
            <div className="inline-block bg-magic/10 text-magic px-3 py-1 rounded-full text-sm font-bold">
              Complete!
            </div>
          )}
          {book.status === 'ready' ? (
            <button
              className="mt-4 w-full h-14 rounded-2xl bg-accent text-accent-foreground font-[family-name:var(--font-marcellus)] font-bold text-lg flex items-center justify-center gap-2 hover:bg-accent/90 shadow-[0_4px_14px] shadow-accent/30 hover:shadow-accent/50 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onStartReading?.(book.id);
              }}
            >
              <Mic className="w-6 h-6" />
              {buttonLabel}
            </button>
          ) : (
            <span className="mt-2 block text-xs text-muted-foreground capitalize">
              {book.status}&hellip;
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <ParentBookCard
      book={book}
      coverColor={coverColor}
      kidProgress={kidProgress ?? []}
      onDelete={onDelete}
    />
  );
};

const ParentBookCard = ({
  book,
  coverColor,
  kidProgress,
  onDelete,
}: {
  book: Book;
  coverColor: string;
  kidProgress: KidProgressEntry[];
  onDelete?: (bookId: string) => void;
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author ?? 'Unknown');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleSave = async () => {
    const trimmedTitle = editTitle.trim();
    const trimmedAuthor = editAuthor.trim();
    if (!trimmedTitle) {
      setEditing(false);
      setEditTitle(book.title);
      setEditAuthor(book.author ?? 'Unknown');
      return;
    }

    const updates: Record<string, string> = {};
    if (trimmedTitle !== book.title) updates.title = trimmedTitle;
    if (trimmedAuthor !== (book.author ?? 'Unknown')) updates.author = trimmedAuthor;

    if (Object.keys(updates).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from('books').update(updates).eq('id', book.id);
      router.refresh();
    } catch {
      setEditTitle(book.title);
      setEditAuthor(book.author ?? 'Unknown');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className="flex rounded-xl border border-border bg-card hover:border-primary transition-colors">
      <div
        className="w-16 flex items-center justify-center shrink-0 rounded-l-xl overflow-hidden"
        style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
      >
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          <BookOpen className="w-8 h-8 text-white/80" />
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-1">
                  <input
                    ref={inputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') {
                        setEditing(false);
                        setEditTitle(book.title);
                        setEditAuthor(book.author ?? 'Unknown');
                      }
                    }}
                    disabled={saving}
                    placeholder="Title"
                    className="w-full text-sm font-bold bg-transparent border-b border-primary outline-none"
                  />
                  <input
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') {
                        setEditing(false);
                        setEditTitle(book.title);
                        setEditAuthor(book.author ?? 'Unknown');
                      }
                    }}
                    onBlur={handleSave}
                    disabled={saving}
                    placeholder="Author"
                    className="w-full text-xs bg-transparent border-b border-muted-foreground/30 outline-none text-muted-foreground"
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-[family-name:var(--font-marcellus)] font-semibold text-foreground truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{book.author}</p>
                </>
              )}
            </div>
            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <PencilLine className="w-4 h-4" />
                    Edit
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(book.id);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground capitalize mt-1">{book.status}</span>
        </div>
        {kidProgress.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {kidProgress.map((kp) => (
              <div key={kp.kidId} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: kp.kidColor }}
                />
                <span className="text-xs text-muted-foreground w-12 truncate shrink-0">
                  {kp.kidName}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${kp.progress}%`, backgroundColor: kp.kidColor }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                  {kp.progress}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
