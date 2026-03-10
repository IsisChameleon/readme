import { createClient } from '@/lib/supabase/server';
import { BookCard } from '@/components/BookCard';
import { UploadCard } from '@/components/UploadCard';
import { MiniOrb } from '@/components/MiniOrb';
import { SignOutButton } from '@/components/SignOutButton';

type Book = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

const ACCENT_COLORS = ['#FF6B6B', '#7DC4A6', '#A78BDA', '#F5A623', '#FF6B6B'];

export default async function DashboardPage() {
  const supabase = await createClient();
  // DEV: bypass auth check
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devUser = (user ?? { email: 'dev@localhost', id: 'dev' }) as any;

  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen" style={{ background: '#FDFAF5' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1
            className="text-5xl"
            style={{ fontFamily: 'var(--font-caveat)', color: '#1e1e1e' }}
          >
            readme
          </h1>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
              style={{ background: '#A78BDA' }}
            >
              {devUser.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <SignOutButton />
          </div>
        </div>

        {/* Library heading */}
        <h2
          className="text-2xl font-semibold mb-6"
          style={{ fontFamily: 'var(--font-nunito)', color: '#1e1e1e' }}
        >
          Your Library
        </h2>

        {/* Book grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {(books as Book[] | null)?.map((book, i) => (
            <BookCard
              key={book.id}
              bookId={book.id}
              title={book.title}
              status={book.status}
              accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
            />
          ))}
          <UploadCard />
        </div>
      </div>

      <MiniOrb />
    </div>
  );
}
