import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Home } from './home';

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }
  if (householdId !== user.id) {
    redirect(`/h/${user.id}`);
  }

  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, avatar, color')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  const kidIds = (kids ?? []).map((k) => k.id);
  const { data: progressRows } = kidIds.length > 0
    ? await supabase
        .from('reading_progress')
        .select('kid_id, book_id, current_chunk_index, updated_at, books(id, title)')
        .in('kid_id', kidIds)
        .order('updated_at', { ascending: false })
    : { data: [] };

  const bookIds = [...new Set((progressRows ?? []).map((r) => r.book_id))];
  const { data: chunkRows } = bookIds.length > 0
    ? await supabase.from('book_chunks').select('book_id').in('book_id', bookIds)
    : { data: [] };

  const totalChunksMap: Record<string, number> = {};
  (chunkRows ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  // Pick each kid's most-recently-updated book (rows are ordered by updated_at desc)
  const kidLastBook: Record<string, { bookId: string; bookTitle: string; progress: number }> = {};
  (progressRows ?? []).forEach((row) => {
    if (kidLastBook[row.kid_id]) return;
    const total = totalChunksMap[row.book_id] ?? 1;
    const pct = Math.round((row.current_chunk_index / total) * 100);
    const books = row.books as unknown as { id: string; title: string }[] | null;
    const book = books?.[0] ?? null;
    kidLastBook[row.kid_id] = {
      bookId: row.book_id,
      bookTitle: book?.title ?? 'Untitled',
      progress: pct,
    };
  });

  const { count: bookCount } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('status', 'ready');

  return (
    <Home
      householdId={householdId}
      userEmail={user.email ?? ''}
      userName={user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''}
      kids={(kids ?? []).map((k) => ({
        ...k,
        lastBook: kidLastBook[k.id] ?? null,
      }))}
      bookCount={bookCount ?? 0}
    />
  );
}
