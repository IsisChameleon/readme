'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LogOut, Trash2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileAvatarProps {
  userName: string;
  userEmail: string;
  householdId: string;
  currentPath?: 'library' | 'readers';
}

export const ProfileAvatar = ({ userName, userEmail, householdId, currentPath }: ProfileAvatarProps) => {
  const router = useRouter();
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const initial = userName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? '?';
  const firstName = userName?.split(' ')[0] ?? userEmail?.split('@')[0] ?? '';

  const isLibrary = currentPath === 'library';
  const isReaders = currentPath === 'readers';

  const menuRowBase = 'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors';
  const activeRow = `${menuRowBase} text-muted-foreground cursor-default italic`;
  const clickableRow = `${menuRowBase} text-muted-foreground hover:bg-secondary cursor-pointer`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full ring-[3px] ring-primary/50 hover:ring-primary transition-all bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground cursor-pointer"
        aria-label="Account menu"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-14 w-72 rounded-xl border border-border bg-card shadow-lg z-30 overflow-hidden"
          >
            <div className="p-4 text-center border-b border-border">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mx-auto ring-[3px] ring-primary/20">
                {initial}
              </div>
              <p className="font-[family-name:var(--font-marcellus)] font-bold mt-2">Hi, {firstName}!</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>

            <div className="py-1">
              {isLibrary ? (
                <div className={activeRow}>
                  <BookOpen className="w-4 h-4" />
                  <span>Library <span className="text-xs">(currently viewing)</span></span>
                </div>
              ) : (
                <button
                  onClick={() => { setOpen(false); router.push(`/h/${householdId}/library`); }}
                  className={clickableRow}
                >
                  <BookOpen className="w-4 h-4" />
                  Library
                </button>
              )}

              {isReaders ? (
                <div className={activeRow}>
                  <Users className="w-4 h-4" />
                  <span>Manage readers <span className="text-xs">(currently viewing)</span></span>
                </div>
              ) : (
                <button
                  onClick={() => { setOpen(false); router.push(`/h/${householdId}/readers`); }}
                  className={clickableRow}
                >
                  <Users className="w-4 h-4" />
                  Manage readers
                </button>
              )}

              <div className="border-t border-border my-1" />

              <button onClick={handleSignOut} className={clickableRow}>
                <LogOut className="w-4 h-4" />
                Sign out
              </button>

              <button
                onClick={() => { /* TODO: delete account flow */ }}
                className={`${menuRowBase} text-destructive hover:bg-destructive/10 cursor-pointer`}
              >
                <Trash2 className="w-4 h-4" />
                Delete account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
