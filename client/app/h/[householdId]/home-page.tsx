'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Settings } from 'lucide-react';
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
  kids: Kid[];
  readyBooks: ReadyBook[];
}

export const HomePage = ({ householdId, kids, readyBooks }: HomePageProps) => {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">EmberTales</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Kid avatars — tap to go to their book library */}
              {kids.map((kid) => (
                <button
                  key={kid.id}
                  onClick={() => router.push(`/h/${householdId}/kid/${kid.id}`)}
                  title={`${kid.name}'s books`}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform hover:scale-110"
                  style={{ backgroundColor: kid.color ?? '#60A5FA' }}
                >
                  {kid.avatar ?? kid.name[0]?.toUpperCase()}
                </button>
              ))}

              {/* Settings cog — parent dashboard */}
              <button
                onClick={() => router.push(`/h/${householdId}/dashboard`)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Card strip */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
              className="underline hover:text-foreground"
            >
              Add one from settings.
            </button>
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Stories, read together
        </div>
      </footer>
    </div>
  );
};
