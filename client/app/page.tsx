import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in - redirect to login
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has completed onboarding
  const { data: household } = await supabase
    .from('households')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  // No household or onboarding not complete = needs onboarding
  if (!household?.onboarding_completed) {
    redirect('/onboarding');
  }

  // Onboarding complete = go to household page
  redirect(`/h/${user.id}`);
}
