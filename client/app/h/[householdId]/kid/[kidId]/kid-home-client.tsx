'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { EmberDragon } from '@/components/EmberDragon';
import { BookCard } from '@/components/BookCard';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface Book {
  id: string;
  title: string;
  status: string;
  cover_image_url: string | null;
  progress: number;
}

interface KidHomeClientProps {
  householdId: string;
  kid: Kid;
  books: Book[];
}

export const KidHomeClient = ({ householdId, kid, books }: KidHomeClientProps) => {
  const router = useRouter();

  const inProgress = books.filter((b) => b.progress > 0 && b.progress < 100);

  const handleStartReading = (bookId: string) => {
    router.push(`/h/${householdId}/kid/${kid.id}/call?bookId=${bookId}`);
  };

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader backHref={`/h/${householdId}`} />

      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <EmberDragon size="md" />
          </motion.div>
          <div className="text-center md:text-left">
            <motion.h2
              className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Hi, {kid.name}!
            </motion.h2>
            <motion.p
              className="text-lg text-muted-foreground flex items-center justify-center md:justify-start gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="w-5 h-5 text-accent" />
              Ready to read?
            </motion.p>
          </div>
        </div>

        {/* Continue Reading */}
        {inProgress.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display text-xl font-bold text-foreground mb-4">Continue Reading</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inProgress.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <BookCard
                    book={{
                      id: book.id,
                      title: book.title,
                      status: book.status,
                      coverImageUrl: book.cover_image_url,
                      progress: book.progress,
                    }}
                    variant="reader"
                    onStartReading={handleStartReading}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* My Books */}
        <div>
          <h3 className="font-display text-xl font-bold text-foreground mb-4">My Books</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <BookCard
                  book={{
                    id: book.id,
                    title: book.title,
                    status: book.status,
                    coverImageUrl: book.cover_image_url,
                    progress: book.progress,
                  }}
                  variant="reader"
                  onStartReading={handleStartReading}
                />
              </motion.div>
            ))}
            {books.length === 0 && (
              <div className="col-span-full flex flex-col items-center py-12 gap-4">
                <EmberDragon size="sm" />
                <p className="text-center text-muted-foreground text-lg">
                  No books here yet
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
