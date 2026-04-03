'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileText, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/api/client';

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
  const color = kid.color ?? '#60A5FA';

  const isResuming = lastBook && lastBook.progress > 0 && lastBook.progress < 100;
  const isSingleBook = readyBooks.length === 1 && !isResuming && !lastBook;
  const singleBook = isSingleBook ? readyBooks[0] : null;

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
      className="w-full cursor-pointer rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-lg flex flex-col gap-4 relative overflow-hidden"
    >
      {/* Color accent stripe */}
      <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl" style={{ backgroundColor: color }} />

      {/* Kid identity */}
      <div className="flex items-center gap-3 pt-2">
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
          style={{ backgroundColor: color }}
        >
          {kid.avatar ?? kid.name[0]?.toUpperCase()}
        </span>
        <h3 className="font-display text-xl font-bold text-foreground">{kid.name}</h3>
      </div>

      {/* Book info or empty state */}
      {isResuming ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="truncate">{lastBook.bookTitle}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${lastBook.progress}%`, backgroundColor: color }}
            />
          </div>
          <span className="inline-block text-sm font-semibold" style={{ color }}>
            Continue &rarr;
          </span>
        </div>
      ) : singleBook ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="truncate">{singleBook.title}</span>
          </div>
          {singleBook.author && singleBook.author !== 'Unknown' && (
            <p className="text-xs text-muted-foreground pl-6">by {singleBook.author}</p>
          )}
          <span className="inline-block text-sm font-semibold mt-2" style={{ color }}>
            Start reading &rarr;
          </span>
        </div>
      ) : readyBooks.length > 0 ? (
        <div>
          <span className="text-sm text-muted-foreground">
            {lastBook?.progress === 100 ? 'Finished! Pick another' : `${readyBooks.length} books`}
          </span>
          <span className="block text-sm font-semibold mt-1" style={{ color }}>
            Browse &rarr;
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">No books yet</span>
      )}
    </motion.button>
  );
};

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
      const form = new FormData();
      form.append('file', file);
      form.append('household_id', householdId);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/books/upload`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
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
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={`w-full cursor-pointer rounded-2xl border-2 border-dashed p-6 text-left transition-colors flex flex-col gap-4 items-center justify-center min-h-[160px] ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        } ${uploading ? 'opacity-60' : ''}`}
      >
        {uploading ? (
          <>
            <FileText className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Uploading {fileName}...</span>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Add a book</p>
              <p className="text-xs text-muted-foreground mt-1">Drop a PDF or tap to browse</p>
            </div>
          </>
        )}
      </button>
    </motion.div>
  );
};
