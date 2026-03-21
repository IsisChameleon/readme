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

  const actualHouseholdId = user?.id ?? 'dev';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}/dashboard`);
  }

  const [{ data: kids }, { data: books }] = await Promise.all([
    supabase
      .from('kids')
      .select('id, name, avatar, color')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('books')
      .select('id, title, status, cover_image_url, created_at')
      .eq('household_id', householdId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false }),
  ]);

  return (
    <ParentDashboardClient
      householdId={householdId}
      kids={kids ?? []}
      books={books ?? []}
    />
  );
}
