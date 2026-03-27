import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: 'sb-readme' },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message, error);
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  // If this is a password recovery flow, redirect to reset page
  const next = searchParams.get('next');
  if (next === '/auth/reset-password') {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  // Get user to check if they need onboarding
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Check if household exists (should be auto-created by trigger, but handle edge cases)
    const { data: household } = await supabase
      .from('households')
      .select('id, onboarding_completed')
      .eq('id', user.id)
      .single();

    // If no household exists (trigger didn't fire or edge case), create one
    if (!household) {
      await supabase.from('households').insert({
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        onboarding_completed: false,
      });
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    // If onboarding not completed, redirect to onboarding
    if (!household.onboarding_completed) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Redirect to home (which will redirect to household page)
  return NextResponse.redirect(`${origin}/`);
};
