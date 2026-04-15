'use client';

import Link from 'next/link';
import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { STRIP_CARD_WIDTH } from './ReaderActionCard';

interface LibraryActionCardProps {
  householdId: string;
  bookCount: number;
  index: number;
}

export const LibraryActionCard = ({ householdId, bookCount, index }: LibraryActionCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();
  const libraryHref = `/h/${householdId}/library`;

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        toast({ title: 'Only PDF files are supported', variant: 'destructive' });
        return;
      }
      setUploading(true);
      setFileName(file.name);
      try {
        const { error } = await apiClient.POST('/books/upload', {
          body: { file: file as unknown as string, household_id: householdId },
          bodySerializer: (body) => {
            const fd = new FormData();
            fd.append('file', (body as Record<string, unknown>).file as File);
            fd.append('household_id', (body as Record<string, unknown>).household_id as string);
            return fd;
          },
        });
        if (error) throw new Error('Upload failed');
        toast({ title: 'Book uploaded!' });
        router.refresh();
      } catch {
        toast({ title: 'Upload failed', variant: 'destructive' });
      } finally {
        setUploading(false);
        setFileName(null);
      }
    },
    [householdId, router]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 260, damping: 24 }}
      className={`rounded-2xl border border-border bg-card overflow-hidden ${STRIP_CARD_WIDTH}`}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />

      <div
        className="relative h-40 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--primary), #40916C)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <Link
          href={libraryHref}
          className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm pl-1 pr-3 py-1 ring-1 ring-white/30 hover:bg-black/40 transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/80">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-white">Library</span>
          <ChevronRight className="w-3 h-3 text-white/80" />
        </Link>

        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-xs text-white/70 mb-0.5">Household shelf</p>
          <p className="font-[family-name:var(--font-marcellus)] text-lg font-bold text-white leading-tight drop-shadow">
            {bookCount === 0 ? 'Add your first book' : 'Add a new book'}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="h-1.5 rounded-full bg-muted/60 border border-dashed border-border" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {uploading
              ? `Uploading ${fileName}...`
              : `${bookCount} ${bookCount === 1 ? 'book' : 'books'} in your shelf`}
          </p>
        </div>

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full cursor-pointer font-[family-name:var(--font-marcellus)] inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-[0_4px_14px] shadow-accent/30 hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          Add a book
        </button>

        <Link
          href={libraryHref}
          className="w-full flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
        >
          <span>
            See all {bookCount} {bookCount === 1 ? 'book' : 'books'}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>
    </motion.div>
  );
};
