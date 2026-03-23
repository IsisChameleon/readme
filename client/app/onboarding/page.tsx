import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from './onboarding-flow';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user already has kids (already onboarded)
  const { data: kids } = await supabase
    .from('kids')
    .select('id')
    .eq('household_id', user.id)
    .limit(1);

  if (kids && kids.length > 0) {
    redirect(`/h/${user.id}`);
  }

  return <OnboardingFlow householdId={user.id} />;
}
