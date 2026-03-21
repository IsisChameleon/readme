import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ModeSelector } from './mode-selector';

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ householdId: string }>;
}) {
  const { householdId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Validate household ownership
  const actualHouseholdId = user?.id ?? 'test_household';
  if (householdId !== actualHouseholdId) {
    redirect(`/h/${actualHouseholdId}`);
  }

  const { data: kids } = await supabase
    .from('kids')
    .select('id, name, avatar, color')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  return <ModeSelector householdId={householdId} kids={kids ?? []} />;
}
