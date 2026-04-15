'use client';

import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ReaderActionCard } from '@/components/ReaderActionCard';
import { LibraryActionCard } from '@/components/LibraryActionCard';

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  progress: number;
}

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
  lastBook: KidLastBook | null;
}

interface HomeProps {
  householdId: string;
  userEmail: string;
  userName: string;
  kids: Kid[];
  bookCount: number;
}

export const Home = ({ householdId, userEmail, userName, kids, bookCount }: HomeProps) => {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <AppHeader
        right={
          <ProfileAvatar userName={userName} userEmail={userEmail} householdId={householdId} />
        }
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:flex-wrap">
          {kids.map((kid, i) => (
            <ReaderActionCard
              key={kid.id}
              householdId={householdId}
              kid={kid}
              lastBook={kid.lastBook}
              bookCount={bookCount}
              index={i}
            />
          ))}
          <LibraryActionCard
            householdId={householdId}
            bookCount={bookCount}
            index={kids.length}
          />
        </div>

        {kids.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            No readers yet.{' '}
            <button
              onClick={() => router.push(`/h/${householdId}/readers`)}
              className="underline hover:text-foreground cursor-pointer"
            >
              Add one.
            </button>
          </p>
        )}
      </main>
    </div>
  );
};
