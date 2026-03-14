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
  const { data: { user } } = await supabase.auth.getUser();
  const householdId = user?.id ?? 'dev';

  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, created_at')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  return (
    <div className="dashboard-panels">
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
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-8 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <UploadCard householdId={householdId} />
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
