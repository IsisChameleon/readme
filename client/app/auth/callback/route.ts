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

  // Get user to check if they need onboarding
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Check if user has any kids (first-time user check)
    const { data: kids } = await supabase
      .from('kids')
      .select('id')
      .eq('household_id', user.id)
      .limit(1);

    // If no kids, redirect to onboarding
    if (!kids || kids.length === 0) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Redirect to home (which will redirect to household page)
  return NextResponse.redirect(`${origin}/`);
};
