'use client';

import { motion } from 'framer-motion';

interface BookCardProps {
  bookId: string;
  title: string;
  status: string;
  accentColor: string;
}

export const BookCard = ({ title, status, accentColor }: BookCardProps) => (
  <motion.div
    className="relative rounded-2xl p-4 flex flex-col gap-2 cursor-pointer select-none"
    style={{
      background: '#fff',
      border: `2px solid ${accentColor}`,
      minHeight: '140px',
    }}
    whileHover={{ scale: 1.03, y: -2 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <span className="text-3xl" aria-hidden="true">📖</span>
    <p
      className="text-sm font-semibold leading-snug line-clamp-3"
      style={{ color: '#1e1e1e', fontFamily: 'var(--font-nunito)' }}
    >
      {title}
    </p>
    {status !== 'ready' && (
      <span
        className="text-xs rounded-full px-2 py-0.5 self-start"
        style={{ background: `${accentColor}22`, color: accentColor }}
      >
        {status}
      </span>
    )}
  </motion.div>
);
