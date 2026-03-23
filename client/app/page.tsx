import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in - redirect to login
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has completed onboarding (has at least one kid)
  const { data: kids } = await supabase
    .from('kids')
    .select('id')
    .eq('household_id', user.id)
    .limit(1);

  // No kids = needs onboarding
  if (!kids || kids.length === 0) {
    redirect('/onboarding');
  }

  // Has kids = go to household page
  redirect(`/h/${user.id}`);
}
