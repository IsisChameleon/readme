'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAccessToken } from '@/lib/api/client';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
}

interface UploadCardProps {
  householdId: string;
  compact?: boolean;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const UploadCard = ({ householdId, compact = false }: UploadCardProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const uploadFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({ title: 'Only PDF files are supported', variant: 'destructive' });
      return;
    }

    const uploadedFile: UploadedFile = {
      id: Math.random().toString(36).slice(2),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
    };

    setFiles((prev) => [...prev, uploadedFile]);

    try {
      const token = await getAccessToken();
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFiles((prev) =>
              prev.map((f) => (f.id === uploadedFile.id ? { ...f, progress } : f))
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));

        const form = new FormData();
        form.append('file', file);
        form.append('household_id', householdId);

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        xhr.open('POST', `${baseUrl}/books/upload`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(form);
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: 'processing', progress: 100 } : f
        )
      );

      toast({ title: 'Book uploaded!', description: 'Processing will complete shortly.' });
      router.refresh();

      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'done' } : f))
        );
      }, 2000);
    } catch {
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'error' } : f))
      );
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    }
  }, [householdId, router]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    selectedFiles.forEach(uploadFile);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {/* Drop zone */}
      {compact ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex items-center gap-3 rounded-xl border border-dashed p-3 cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Add a book</p>
            <p className="text-xs text-muted-foreground">Drop PDF or click to browse</p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`
            rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          `}
        >
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold">Drop PDF files here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">PDF files only</p>
        </div>
      )}

      {/* File list */}
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              {file.status === 'uploading' && (
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="shrink-0">
              {file.status === 'done' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              {file.status === 'processing' && (
                <span className="text-xs text-muted-foreground">Processing…</span>
              )}
              {file.status === 'error' && <AlertCircle className="w-5 h-5 text-destructive" />}
              {file.status === 'uploading' && (
                <span className="text-xs text-muted-foreground">{file.progress}%</span>
              )}
            </div>
            <button
              onClick={() => removeFile(file.id)}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
