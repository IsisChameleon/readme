'use client';

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
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
        className="relative rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer select-none w-full"
        style={{
          minHeight: '140px',
          border: '2px dashed #A78BDA',
          background: 'transparent',
          opacity: uploading ? 0.6 : 1,
        }}
        whileHover={{ boxShadow: '0 0 0 4px #A78BDA22' }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        disabled={uploading}
        aria-label="Upload a PDF book"
      >
        <span className="text-3xl" style={{ color: '#A78BDA' }} aria-hidden="true">
          {uploading ? '⏳' : '+'}
        </span>
        <span className="text-xs font-semibold" style={{ color: '#A78BDA', fontFamily: 'var(--font-nunito)' }}>
          {uploading ? 'Uploading…' : 'Upload PDF'}
        </span>
      </motion.button>
    </>
  );
};
