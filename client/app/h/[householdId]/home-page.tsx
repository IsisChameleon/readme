'use client';

import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { KidCard, UploadCard } from '@/components/HomeCard';

interface KidLastBook {
  bookId: string;
  bookTitle: string;
  coverUrl: string | null;
  progress: number;
}

interface ReadyBook {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
}

interface Kid {
  id: string;
  name: string;
  avatar: string | null;
  color: string | null;
  lastBook: KidLastBook | null;
}

interface HomePageProps {
  householdId: string;
  userEmail: string;
  userName: string;
  kids: Kid[];
  readyBooks: ReadyBook[];
}

export const HomePage = ({ householdId, userEmail, userName, kids, readyBooks }: HomePageProps) => {
  const router = useRouter();

  const rightSlot = (
    <>
      {/* Kid avatars — quick nav to each kid's library */}
      <div className="hidden sm:flex items-center gap-1.5 mr-1">
        {kids.map((kid) => (
          <button
            key={kid.id}
            onClick={() => router.push(`/h/${householdId}/kid/${kid.id}`)}
            title={`${kid.name}'s books`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110 cursor-pointer"
            style={{ backgroundColor: kid.color ?? 'var(--kid-fern)' }}
          >
            {kid.avatar ?? kid.name[0]?.toUpperCase()}
          </button>
        ))}
      </div>
      <ProfileAvatar
        userName={userName}
        userEmail={userEmail}
        householdId={householdId}
      />
    </>
  );

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <AppHeader right={rightSlot} />

      {/* Card strip — horizontal scroll in landscape, vertical in portrait */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col gap-5 md:flex-row md:flex-wrap">
          {kids.map((kid, i) => (
            <KidCard
              key={kid.id}
              householdId={householdId}
              kid={kid}
              lastBook={kid.lastBook}
              readyBooks={readyBooks}
              index={i}
            />
          ))}
          <UploadCard householdId={householdId} index={kids.length} />
        </div>

        {kids.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            No readers yet.{' '}
            <button
              onClick={() => router.push(`/h/${householdId}/dashboard`)}
              className="underline hover:text-foreground cursor-pointer"
            >
              Add one from Manage.
            </button>
          </p>
        )}
      </main>

      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Stories, read together
        </div>
      </footer>
    </div>
  );
};
