'use client';

import { motion } from 'framer-motion';
import { EmberDragon } from '@/components/EmberDragon';

interface AnimatedOrbProps {
  isActive: boolean;
  isSpeaking: boolean;
}

/** Pre-computed random offsets for speaking bars to avoid impure render calls */
const BAR_HEIGHTS = [32, 36, 28, 40, 34];
const BAR_DURATIONS = [0.7, 0.85, 0.65, 0.9, 0.75];

export const AnimatedOrb = ({ isActive, isSpeaking }: AnimatedOrbProps) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full border border-white/10"
          style={{
            width: `${200 + i * 60}px`,
            height: `${200 + i * 60}px`,
          }}
          animate={
            isActive
              ? {
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.1, 0.3],
                }
              : { scale: 1, opacity: 0.1 }
          }
          transition={{
            duration: isSpeaking ? 1.5 : 3,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Center orb */}
      <motion.div
        className="w-40 h-40 md:w-52 md:h-52 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        }}
        animate={
          isActive
            ? { scale: [1, 1.03, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isSpeaking ? (
          <div className="flex items-center gap-1.5">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`bar-${i}`}
                className="w-1.5 bg-white rounded-full"
                animate={{ height: [12, BAR_HEIGHTS[i], 12] }}
                transition={{
                  duration: BAR_DURATIONS[i],
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        ) : (
          <EmberDragon size="sm" isListening={isActive} />
        )}
      </motion.div>
    </div>
  );
};
