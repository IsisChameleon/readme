'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export const MiniOrb = () => (
  <Link href="/call" aria-label="Start reading session">
    <motion.div
      className="fixed bottom-6 right-6 z-50 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
      style={{
        width: 56,
        height: 56,
        background: 'radial-gradient(circle at 35% 35%, #c4a8f0, #8b5cf6)',
      }}
      animate={{
        scale: [1, 1.08, 1],
        boxShadow: [
          '0 0 0 0 #A78BDA44',
          '0 0 0 12px #A78BDA00',
          '0 0 0 0 #A78BDA44',
        ],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-white text-lg" aria-hidden="true">🎙</span>
    </motion.div>
  </Link>
);
