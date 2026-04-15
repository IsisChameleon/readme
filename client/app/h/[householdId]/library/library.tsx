'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { UploadCard } from '@/components/UploadCard';
import { BookCard } from '@/components/BookCard';
import { createClient } from '@/lib/supabase/client';

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
}

interface KidProgress {
  kidId: string;
  progress: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  status: string;
  cover_image_url: string | null;
  created_at: string;
  kidProgress: KidProgress[];
}

interface Props {
  householdId: string;
  userEmail: string;
  userName: string;
  kids: Kid[];
  books: Book[];
}

export const Library = ({ householdId, userEmail, userName, kids, books }: Props) => {
  const router = useRouter();

  const handleDeleteBook = async (bookId: string) => {
    const supabase = createClient();
    await supabase.from('books').update({ status: 'deleted' }).eq('id', bookId);
    router.refresh();
  };

  const kidMap = new Map(kids.map((k) => [k.id, k]));

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader
        backHref={`/h/${householdId}`}
        right={
          <ProfileAvatar
            userName={userName}
            userEmail={userEmail}
            householdId={householdId}
            currentPath="library"
          />
        }
      />

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <UploadCard householdId={householdId} compact />

        <div className="space-y-3">
          {books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <BookCard
                variant="parent"
                book={{
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  status: book.status,
                  coverImageUrl: book.cover_image_url,
                }}
                kidProgress={book.kidProgress
                  .map(({ kidId, progress }) => {
                    const kid = kidMap.get(kidId);
                    if (!kid) return null;
                    return {
                      kidId,
                      kidName: kid.name,
                      kidColor: kid.color ?? '#5CB87A',
                      progress,
                    };
                  })
                  .filter((x): x is NonNullable<typeof x> => x !== null)}
                onDelete={handleDeleteBook}
              />
            </motion.div>
          ))}
        </div>

        {books.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No books yet. Upload a PDF to get started.
          </p>
        )}
      </main>
    </div>
  );
};
