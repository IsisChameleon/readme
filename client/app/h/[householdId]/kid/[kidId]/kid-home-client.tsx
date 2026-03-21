'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push(`/h/${householdId}`)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-bold text-primary">EmberTales</h1>
        <div className="w-9" />
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Welcome section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          >
            <EmberDragon size="md" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Hi, {kid.name}!
            </h2>
            <p className="text-muted-foreground mt-1">Ready for a reading adventure?</p>
          </div>
        </motion.div>

        {/* Continue Reading */}
        {inProgress.length > 0 && (
          <section>
            <h3 className="text-lg font-display font-bold mb-3">Continue Reading</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {inProgress.map((book) => (
                <BookCard
                  key={book.id}
                  book={{
                    id: book.id,
                    title: book.title,
                    status: book.status,
                    coverImageUrl: book.cover_image_url,
                    progress: book.progress,
                  }}
                  variant="kid"
                  onStartReading={handleStartReading}
                />
              ))}
            </div>
          </section>
        )}

        {/* My Books */}
        <section>
          <h3 className="text-lg font-display font-bold mb-3">My Books</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={{
                  id: book.id,
                  title: book.title,
                  status: book.status,
                  coverImageUrl: book.cover_image_url,
                  progress: book.progress,
                }}
                variant="kid"
                onStartReading={handleStartReading}
              />
            ))}
            {books.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No books yet! Ask a parent to add some.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
