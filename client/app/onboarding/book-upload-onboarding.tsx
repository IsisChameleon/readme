'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';
import { FileText, CheckCircle2, X, AlertCircle, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getAccessToken } from '@/lib/api/client';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'done' | 'error';
  progress: number;
}

interface BookUploadOnboardingProps {
  householdId: string;
  onUploadComplete: () => void;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const BookUploadOnboarding = ({ householdId, onUploadComplete }: BookUploadOnboardingProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'done' } : f))
        );
        onUploadComplete();
      }, 2000);
    } catch {
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadedFile.id ? { ...f, status: 'error' } : f))
      );
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    }
  }, [householdId, onUploadComplete]);

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
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all
          ${isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'}
        `}
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <p className="text-base font-semibold mb-1">Drop a PDF book here</p>
        <p className="text-sm text-muted-foreground">or click to browse your files</p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-4"
          >
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
              {file.status === 'uploading' && (
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {file.status === 'done' && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
              {file.status === 'processing' && (
                <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>
              )}
              {file.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              {file.status === 'uploading' && (
                <span className="text-xs font-medium text-primary">{file.progress}%</span>
              )}
              <button
                onClick={() => removeFile(file.id)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-2">
          Supported format: PDF
        </p>
      )}
    </div>
  );
}
