'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileText, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

/** Woodland kid palette — deterministic color from a string */
const PALETTE = ['#E9A55F', '#5CB87A', '#6B8FD4', '#C56B8A', '#8FB56A', '#8B6DAF', '#5BAEC4'];

const colorFromString = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

/** Shared sizing for all strip cards — grow to fill, cap at 32rem */
const CARD_WIDTH = 'md:flex-1 md:min-w-80 md:max-w-[32rem]';

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  coverUrl: string | null;
  progress: number;
}

interface ReadyBook {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
}

interface KidCardProps {
  householdId: string;
  kid: {
    id: string;
    name: string;
    avatar: string | null;
    color: string | null;
  };
  lastBook: KidLastBook | null;
  readyBooks: ReadyBook[];
  index: number;
}

export const KidCard = ({ householdId, kid, lastBook, readyBooks, index }: KidCardProps) => {
  const router = useRouter();
  const color = kid.color ?? '#5CB87A';

  const isResuming = lastBook && lastBook.progress > 0 && lastBook.progress < 100;
  const isSingleBook = readyBooks.length === 1 && !isResuming && !lastBook;
  const singleBook = isSingleBook ? readyBooks[0] : null;

  const coverUrl = isResuming ? lastBook.coverUrl : singleBook?.cover_image_url ?? null;
  const bookTitle = isResuming ? lastBook.bookTitle : singleBook?.title ?? null;
  const bookAuthor = singleBook?.author ?? null;
  const placeholderColor = bookTitle ? colorFromString(bookTitle) : color;

  const handleAction = () => {
    if (isResuming) {
      router.push(`/h/${householdId}/kid/${kid.id}/call?bookId=${lastBook.bookId}`);
    } else if (singleBook) {
      router.push(`/h/${householdId}/kid/${kid.id}/call?bookId=${singleBook.id}`);
    } else {
      router.push(`/h/${householdId}/kid/${kid.id}`);
    }
  };

  return (
    <motion.button
      onClick={handleAction}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full rounded-2xl border border-border bg-card text-left overflow-hidden cursor-pointer transition-all hover:border-primary ${CARD_WIDTH}`}
    >
      {/* Cover hero / placeholder */}
      <div className="relative h-44 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookPlaceholder title={bookTitle} author={bookAuthor} color={placeholderColor} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Kid identity overlay */}
        <div className="absolute bottom-3 left-4 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold text-white ring-2 ring-white/80"
            style={{ backgroundColor: color }}
          >
            {kid.avatar ?? kid.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-[family-name:var(--font-marcellus)] text-base font-bold text-white">
              {kid.name}
            </p>
            <p className="text-xs text-white/80">
              {isResuming ? 'Reading now' : singleBook ? 'New book ready' : readyBooks.length > 0 ? `${readyBooks.length} books` : 'No books yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Book info / action */}
      <div className="p-5">
        {isResuming ? (
          <>
            <p className="font-[family-name:var(--font-marcellus)] font-semibold truncate">
              {lastBook.bookTitle}
            </p>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${lastBook.progress}%`, backgroundColor: color }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{lastBook.progress}% complete</span>
              <span className="text-sm font-semibold" style={{ color }}>Continue &rarr;</span>
            </div>
          </>
        ) : singleBook ? (
          <>
            <p className="font-[family-name:var(--font-marcellus)] font-semibold truncate">
              {singleBook.title}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {singleBook.author && singleBook.author !== 'Unknown' ? `by ${singleBook.author}` : ''}
              </span>
              <span className="text-sm font-semibold" style={{ color }}>Start reading &rarr;</span>
            </div>
          </>
        ) : readyBooks.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {lastBook?.progress === 100 ? 'Finished! Pick another' : `${readyBooks.length} books`}
            </span>
            <span className="text-sm font-semibold" style={{ color }}>Browse &rarr;</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Upload a book to get started</p>
        )}
      </div>
    </motion.button>
  );
};

/** Coloured placeholder when no cover image — shows book title + author */
const BookPlaceholder = ({ title, author, color }: { title: string | null; author: string | null; color: string }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: color }}>
    <BookOpen className="w-10 h-10 text-white/40 mb-3" />
    {title && (
      <p className="font-[family-name:var(--font-marcellus)] text-white/90 font-bold text-sm leading-tight line-clamp-2">
        {title}
      </p>
    )}
    {author && author !== 'Unknown' && (
      <p className="text-white/60 text-xs mt-1 truncate max-w-full">{author}</p>
    )}
  </div>
);

interface UploadCardProps {
  householdId: string;
  index: number;
}

export const UploadCard = ({ householdId, index }: UploadCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

  const uploadFile = useCallback(async (file: File) => {
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
  }, [householdId, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

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
      className={CARD_WIDTH}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={`w-full h-full cursor-pointer rounded-2xl border-2 border-dashed p-6 text-left transition-colors flex flex-col gap-4 items-center justify-center ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'
        } ${uploading ? 'opacity-60' : ''}`}
      >
        {uploading ? (
          <>
            <FileText className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Uploading {fileName}...</span>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Upload className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="font-[family-name:var(--font-marcellus)] font-semibold text-foreground">Add a Book</p>
              <p className="text-sm text-muted-foreground mt-1">Drop PDF or click to browse</p>
            </div>
          </>
        )}
      </button>
    </motion.div>
  );
};
