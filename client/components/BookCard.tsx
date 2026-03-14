'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface BookCardProps {
  bookId: string;
  title: string;
  status: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ready: { color: 'var(--db-status-ready)', label: 'Ready' },
  processing: { color: 'var(--db-status-processing)', label: 'Processing' },
  error: { color: 'var(--db-status-error)', label: 'Error' },
};

export const BookCard = ({ bookId, title, status }: BookCardProps) => {
  const statusInfo = statusConfig[status] ?? statusConfig.processing;
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
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
    if (!trimmed || trimmed === title) {
      setEditing(false);
      setEditTitle(title);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ title: trimmed })
        .eq('id', bookId);

      if (error) throw error;
      router.refresh();
    } catch {
      setEditTitle(title);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('books')
        .update({ status: 'deleted' })
        .eq('id', bookId);

      if (error) throw error;
      router.refresh();
    } catch {
      // Silently fail — book stays visible
    } finally {
      setSaving(false);
      setMenuOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRename();
    if (e.key === 'Escape') {
      setEditing(false);
      setEditTitle(title);
    }
  };

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        background: 'var(--db-card)',
        border: '1px solid var(--db-card-border)',
        opacity: saving ? 0.6 : 1,
      }}
      whileHover={{
        scale: 1.03,
        y: -2,
        boxShadow: '0 4px 20px var(--db-glow)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Cover placeholder */}
      <div
        className="flex items-center justify-center"
        style={{
          height: 130,
          background: 'linear-gradient(145deg, var(--db-muted), var(--db-card))',
        }}
      >
        <span className="text-4xl opacity-40">📖</span>
      </div>

      {/* Three-dot menu button */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: menuOpen ? 'var(--db-muted)' : 'transparent' }}
          aria-label="Book actions"
        >
          <DotsThreeVertical size={18} weight="bold" color="var(--db-muted-fg)" />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 mt-1 rounded-xl overflow-hidden z-10"
              style={{
                background: 'var(--db-card)',
                border: '1px solid var(--db-border)',
                minWidth: 140,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); setEditing(true); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                style={{ color: 'var(--db-fg)', fontFamily: 'var(--font-nunito)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <PencilSimple size={14} weight="bold" />
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors"
                style={{ color: 'var(--coral)', fontFamily: 'var(--font-nunito)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash size={14} weight="bold" />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text area */}
      <div className="p-3">
        {editing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleRename}
            className="text-sm font-semibold leading-snug w-full bg-transparent outline-none rounded px-1"
            style={{
              color: 'var(--db-fg)',
              fontFamily: 'var(--font-nunito)',
              border: '1px solid var(--db-border)',
            }}
          />
        ) : (
          <p
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: 'var(--db-fg)', fontFamily: 'var(--font-nunito)' }}
          >
            {title}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: statusInfo.color }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--db-muted-fg)' }}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
