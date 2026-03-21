'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { EmberDragon } from '@/components/EmberDragon';
import { Users, Baby, BookOpen } from 'lucide-react';

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">EmberTales</h1>
              <p className="text-sm text-muted-foreground">AI Reading Companion</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-8"
        >
          <EmberDragon size="lg" />
        </motion.div>

        <motion.h2
          className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome to EmberTales!
        </motion.h2>

        <motion.p
          className="text-lg text-muted-foreground text-center mb-10 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Your friendly dragon reading companion that makes learning to read fun and engaging.
        </motion.p>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Parent mode card */}
          <button
            onClick={() => router.push(`/h/${householdId}/dashboard`)}
            className="cursor-pointer rounded-xl border border-border bg-card py-6 px-6 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-primary group"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Parent Mode
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload books, track progress, and manage your children&apos;s reading library.
            </p>
          </button>

          {/* Kid mode card */}
          <div className="rounded-xl border border-border bg-card py-6 px-6 shadow-sm flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-accent group">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <Baby className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Kid Mode
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a voice reading session with Ember the dragon!
            </p>

            {/* Kid selection */}
            {kids.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No kids yet — add one from the parent dashboard!
              </p>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => router.push(`/h/${householdId}/kid/${kid.id}`)}
                    className="flex items-center gap-2 rounded-full px-4 py-2 border border-border bg-background hover:border-primary transition-colors cursor-pointer"
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: kid.color ?? '#60A5FA' }}
                    >
                      {kid.avatar ?? kid.name[0]?.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold">{kid.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Made with love for young readers
        </div>
      </footer>
    </div>
  );
};
