import { createClient } from '@/lib/supabase/server';
import { BookCard } from '@/components/BookCard';
import { UploadCard } from '@/components/UploadCard';
import { ReadingOrb } from '@/components/ReadingOrb';

type Book = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div
      className="dashboard-panels"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, var(--db-glow) 0%, transparent 70%)',
      }}
    >
      {/* Panel 1: Orb Hero */}
      <div className="dashboard-panel dashboard-panel--orb">
        <ReadingOrb />
      </div>

      {/* Divider (desktop only) */}
      <div
        className="mx-auto hidden lg:block"
        style={{ width: 60, height: 1, background: 'var(--db-border)' }}
      />

      {/* Panel 2: Library */}
      <div className="dashboard-panel dashboard-panel--library">
        <div className="max-w-5xl mx-auto px-6 py-8 w-full">
          <h2
            className="text-2xl font-semibold mb-6"
            style={{ fontFamily: 'var(--font-nunito)', color: 'var(--db-fg)' }}
          >
            Your Library
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <UploadCard />
            {(books as Book[] | null)?.map((book) => (
              <BookCard
                key={book.id}
                bookId={book.id}
                title={book.title}
                status={book.status}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
