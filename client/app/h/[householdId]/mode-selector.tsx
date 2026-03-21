'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { EmberDragon } from '@/components/EmberDragon';
import { Users, Baby } from 'lucide-react';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface ModeSelectorProps {
  householdId: string;
  kids: Kid[];
}

export const ModeSelector = ({ householdId, kids }: ModeSelectorProps) => {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 py-8 gap-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl md:text-5xl font-display text-primary font-bold">
          EmberTales
        </h1>
        <p className="text-muted-foreground mt-2">Stories read together</p>
      </motion.div>

      {/* Dragon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
      >
        <EmberDragon size="lg" />
      </motion.div>

      {/* Mode cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        {/* Parent mode */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/h/${householdId}/dashboard`)}
          className="flex-1 rounded-2xl border border-border bg-card p-6 text-left cursor-pointer"
        >
          <Users className="w-8 h-8 text-primary mb-3" />
          <h2 className="text-lg font-bold font-display">Parent Mode</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage books, track progress
          </p>
        </motion.button>

        {/* Kid mode */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-1 rounded-2xl border border-border bg-card p-6"
        >
          <Baby className="w-8 h-8 text-accent mb-3" />
          <h2 className="text-lg font-bold font-display mb-3">Kid Mode</h2>
          {kids.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No kids yet — add one from the parent dashboard!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => router.push(`/h/${householdId}/kid/${kid.id}`)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 border border-border bg-background hover:border-primary transition-colors cursor-pointer"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: kid.color ?? '#60A5FA' }}
                  >
                    {kid.avatar ?? kid.name[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold">{kid.name}</span>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
