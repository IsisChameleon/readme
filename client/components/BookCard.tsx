'use client';

import { motion } from 'framer-motion';

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

export const BookCard = ({ title, status }: BookCardProps) => {
  const statusInfo = statusConfig[status] ?? statusConfig.processing;

  return (
    <motion.div
      className="rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{
        background: 'var(--db-card)',
        border: '1px solid var(--db-card-border)',
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

      {/* Text area */}
      <div className="p-3">
        <p
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: 'var(--db-fg)', fontFamily: 'var(--font-nunito)' }}
        >
          {title}
        </p>
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
