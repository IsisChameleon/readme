import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const householdId = user?.id ?? 'test_household';
  redirect(`/h/${householdId}`);
}
