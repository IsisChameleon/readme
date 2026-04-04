import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from './onboarding-flow';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has completed onboarding
  const { data: household } = await supabase
    .from('households')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  // If already completed onboarding, go to dashboard
  if (household?.onboarding_completed) {
    redirect(`/h/${user.id}`);
  }

  // If no household exists, create one (edge case)
  if (!household) {
    await supabase.from('households').insert({
      id: user.id,
      name: user.user_metadata?.full_name || user.email,
      onboarding_completed: false,
    });
  }

  // Fetch any kids already created (e.g. user started onboarding but didn't finish)
  const { data: existingKids } = await supabase
    .from('kids')
    .select('id, name')
    .eq('household_id', user.id);

  return <OnboardingFlow householdId={user.id} existingKids={existingKids ?? []} />;
}
