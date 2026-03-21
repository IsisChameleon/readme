'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Mic, Trash2, CheckCircle2, PencilLine, MoreVertical } from 'lucide-react';
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

interface BookCardNewProps {
  book: Book;
  variant?: 'parent' | 'kid';
  onStartReading?: (bookId: string) => void;
  onDelete?: (bookId: string) => void;
}

export const BookCardNew = ({
  book,
  variant = 'kid',
  onStartReading,
  onDelete,
}: BookCardNewProps) => {
  const progress = book.progress ?? 0;
  const coverColor = getCoverColor(book.id);

  const buttonLabel = progress === 100
    ? 'Read Again'
    : progress > 0
      ? 'Continue'
      : 'Start Reading';

  if (variant === 'kid') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer touch-manipulation"
        onClick={() => book.status === 'ready' && onStartReading?.(book.id)}
      >
        <div
          className="relative h-44 md:h-52 flex items-center justify-center"
          style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
        >
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <BookOpen className="w-16 h-16 text-white/80" />
          )}
          {progress === 100 && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Done!
            </div>
          )}
          {progress > 0 && progress < 100 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div className="h-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{book.title}</h3>
          {book.author && (
            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
          )}
          {book.status === 'ready' ? (
            <button
              className="mt-2 w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2"
              onClick={(e) => { e.stopPropagation(); onStartReading?.(book.id); }}
            >
              <Mic className="w-4 h-4" />
              {buttonLabel}
            </button>
          ) : (
            <span className="mt-2 block text-xs text-muted-foreground capitalize">
              {book.status}…
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Parent variant with rename + delete
  return <ParentBookCard book={book} coverColor={coverColor} progress={progress} onDelete={onDelete} />;
};

const ParentBookCard = ({
  book,
  coverColor,
  progress,
  onDelete,
}: {
  book: Book;
  coverColor: string;
  progress: number;
  onDelete?: (bookId: string) => void;
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);
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

  const handleRename = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === book.title) {
      setEditing(false);
      setEditTitle(book.title);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from('books').update({ title: trimmed }).eq('id', book.id);
      router.refresh();
    } catch {
      setEditTitle(book.title);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div
        className="w-16 h-20 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: book.coverImageUrl ? undefined : coverColor }}
      >
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} className="w-full h-full object-cover rounded-lg" alt="" />
        ) : (
          <BookOpen className="w-8 h-8 text-white/80" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') { setEditing(false); setEditTitle(book.title); }
            }}
            disabled={saving}
            className="w-full text-sm font-bold bg-transparent border-b border-primary outline-none"
          />
        ) : (
          <h3 className="font-bold text-sm truncate">{book.title}</h3>
        )}
        {book.author && (
          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        )}
        <span className="text-xs text-muted-foreground capitalize">{book.status}</span>
        {progress > 0 && (
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
            <button
              onClick={() => { setMenuOpen(false); setEditing(true); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <PencilLine className="w-4 h-4" />
              Rename
            </button>
            {onDelete && (
              <button
                onClick={() => { setMenuOpen(false); onDelete(book.id); }}
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
  );
};
