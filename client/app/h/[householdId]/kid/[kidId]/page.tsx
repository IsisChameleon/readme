import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KidHomeClient } from './kid-home-client';

export default async function KidHomePage({
  params,
}: {
  params: Promise<{ householdId: string; kidId: string }>;
}) {
  const { householdId, kidId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const actualHouseholdId = user?.id ?? 'dev';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}`);
  }

  const { data: kid } = await supabase
    .from('kids')
    .select('id, name, avatar, color')
    .eq('id', kidId)
    .single();

  if (!kid) {
    redirect(`/h/${householdId}`);
  }

  const { data: books } = await supabase
    .from('books')
    .select('id, title, status, cover_image_url')
    .eq('household_id', householdId)
    .eq('status', 'ready')
    .order('created_at', { ascending: false });

  const { data: progress } = await supabase
    .from('reading_progress')
    .select('book_id, current_chunk_index')
    .eq('kid_id', kidId);

  const bookIds = (books ?? []).map((b) => b.id);
  const { data: chunkCounts } = bookIds.length > 0
    ? await supabase
        .from('book_chunks')
        .select('book_id')
        .in('book_id', bookIds)
    : { data: [] };

  const totalChunksMap: Record<string, number> = {};
  (chunkCounts ?? []).forEach((row) => {
    totalChunksMap[row.book_id] = (totalChunksMap[row.book_id] ?? 0) + 1;
  });

  const progressMap: Record<string, number> = {};
  (progress ?? []).forEach((p) => {
    const total = totalChunksMap[p.book_id] ?? 1;
    progressMap[p.book_id] = Math.round((p.current_chunk_index / total) * 100);
  });

  return (
    <KidHomeClient
      householdId={householdId}
      kid={kid}
      books={(books ?? []).map((b) => ({
        ...b,
        progress: progressMap[b.id] ?? 0,
      }))}
    />
  );
}
