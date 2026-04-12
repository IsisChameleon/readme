import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ParentDashboardClient } from './dashboard-client';

export default async function ParentDashboardPage({
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
    redirect(`/h/${user.id}/dashboard`);
  }

  const [{ data: kids }, { data: books }] = await Promise.all([
    supabase
      .from('kids')
      .select('id, name, avatar, color')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('books')
      .select('id, title, author, status, cover_image_url, created_at')
      .eq('household_id', householdId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }),
  ]);

  // Fetch reading progress for all kids
  const kidIds = (kids ?? []).map((k) => k.id);
  const { data: progressRows } = kidIds.length > 0
    ? await supabase
        .from('reading_progress')
        .select('kid_id, book_id, current_chunk_index')
        .in('kid_id', kidIds)
    : { data: [] };

  // Get total chunk counts per book
  const bookIds = (books ?? []).map((b) => b.id);
  const { data: chunkRows } = bookIds.length > 0
    ? await supabase.from('book_chunks').select('book_id').in('book_id', bookIds)
    : { data: [] };

  const totalChunksMap: Record<string, number> = {};
  (chunkRows ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  // Build per-book, per-kid progress
  const bookProgress: Record<string, { kidId: string; progress: number }[]> = {};
  (progressRows ?? []).forEach((row) => {
    const total = totalChunksMap[row.book_id] ?? 1;
    const pct = Math.round((row.current_chunk_index / total) * 100);
    if (!bookProgress[row.book_id]) bookProgress[row.book_id] = [];
    bookProgress[row.book_id].push({ kidId: row.kid_id, progress: pct });
  });

  return (
    <ParentDashboardClient
      householdId={householdId}
      userEmail={user.email ?? ''}
      userName={user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''}
      kids={kids ?? []}
      books={(books ?? []).map((b) => ({
        ...b,
        kidProgress: bookProgress[b.id] ?? [],
      }))}
    />
  );
}
