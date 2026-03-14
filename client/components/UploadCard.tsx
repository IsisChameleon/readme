'use client';

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Plus, SpinnerGap } from '@phosphor-icons/react';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/hooks/use-toast';

export const UploadCard = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'Only PDF files are supported', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const { error } = await apiClient.POST('/admin/books/upload', {
        body: { file } as never,
        bodySerializer: () => {
          const form = new FormData();
          form.append('file', file);
          return form;
        },
      });

      if (error) throw new Error('Upload failed');

      toast({ title: 'Book uploaded!', description: 'Processing will complete shortly.', variant: 'success' as never });
    } catch {
      toast({ title: 'Upload failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleChange}
      />
      <motion.button
        className="rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer select-none w-full"
        style={{
          border: '2px dashed var(--db-border-dashed)',
          background: 'rgba(30, 23, 48, 0.25)',
          opacity: uploading ? 0.6 : 1,
        }}
        whileHover={{
          boxShadow: '0 0 0 4px var(--db-glow)',
          background: 'rgba(30, 23, 48, 0.5)',
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        disabled={uploading}
        aria-label="Upload a PDF book"
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
          style={{ background: 'var(--db-glow)' }}
        >
          {uploading ? (
            <SpinnerGap size={24} weight="bold" color="var(--db-accent)" className="animate-spin" />
          ) : (
            <Plus size={24} weight="bold" color="var(--db-accent)" />
          )}
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--db-primary)', fontFamily: 'var(--font-nunito)' }}
        >
          {uploading ? 'Uploading…' : 'Upload PDF'}
        </span>
        {!uploading && (
          <span className="text-xs" style={{ color: 'var(--db-muted-fg)' }}>
            Drop file or click
          </span>
        )}
      </motion.button>
    </>
  );
};
