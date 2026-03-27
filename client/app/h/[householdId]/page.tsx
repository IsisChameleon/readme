import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomePage } from './home-page';

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actualHouseholdId = user?.id ?? 'test_household';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}`);
  }

  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, avatar, color')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  // Fetch reading progress per kid with book info
  const kidIds = (kids ?? []).map((k) => k.id);
  const { data: progressRows } = kidIds.length > 0
    ? await supabase
        .from('reading_progress')
        .select('kid_id, book_id, current_chunk_index, books(id, title, cover_image_url)')
        .in('kid_id', kidIds)
    : { data: [] };

  // Get total chunk counts for books in progress
  const bookIds = [...new Set((progressRows ?? []).map((r) => r.book_id))];
  const { data: chunkRows } = bookIds.length > 0
    ? await supabase.from('book_chunks').select('book_id').in('book_id', bookIds)
    : { data: [] };

  const totalChunksMap: Record<string, number> = {};
  (chunkRows ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  // Build per-kid last book info
  const kidProgress: Record<string, { bookId: string; bookTitle: string; coverUrl: string | null; progress: number }> = {};
  (progressRows ?? []).forEach((row) => {
    const total = totalChunksMap[row.book_id] ?? 1;
    const pct = Math.round((row.current_chunk_index / total) * 100);
    const existing = kidProgress[row.kid_id];
    if (!existing || pct > existing.progress) {
      const books = row.books as unknown as { id: string; title: string; cover_image_url: string | null }[] | null;
      const book = books?.[0] ?? null;
      kidProgress[row.kid_id] = {
        bookId: row.book_id,
        bookTitle: book?.title ?? 'Untitled',
        coverUrl: book?.cover_image_url ?? null,
        progress: pct,
      };
    }
  });

  // Fetch all ready books (needed for book count + single-book shortcut)
  const { data: allBooks } = await supabase
    .from('books')
    .select('id, title, author, cover_image_url')
    .eq('household_id', householdId)
    .eq('status', 'ready')
    .order('created_at', { ascending: false });

  const readyBooks = allBooks ?? [];

  return (
    <HomePage
      householdId={householdId}
      kids={(kids ?? []).map((k) => ({
        ...k,
        lastBook: kidProgress[k.id] ?? null,
      }))}
      readyBooks={readyBooks}
    />
  );
}
