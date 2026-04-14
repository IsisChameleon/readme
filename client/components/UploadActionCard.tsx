'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { STRIP_CARD_WIDTH } from './ReaderActionCard';

interface UploadActionCardProps {
  householdId: string;
  index: number;
}

export const UploadActionCard = ({ householdId, index }: UploadActionCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const router = useRouter();

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
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
      className={STRIP_CARD_WIDTH}
    >
      <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleChange} />
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
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
              <p className="font-[family-name:var(--font-marcellus)] font-semibold text-foreground">
                Add a Book
              </p>
              <p className="text-sm text-muted-foreground mt-1">Drop PDF or click to browse</p>
            </div>
          </>
        )}
      </button>
    </motion.div>
  );
};
