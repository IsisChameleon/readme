import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: 'sb-readme' },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // If any page receives a ?code= param, forward to the auth callback
  // (Supabase password reset emails may land on site_url instead of redirectTo)
  // clone() preserves all existing search params (code, type=recovery, email, etc.)
  const code = request.nextUrl.searchParams.get('code');
  if (code && pathname !== '/auth/callback') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    if (pathname === '/auth/login' || pathname === '/auth/forgot-password') {
      url.searchParams.set('next', '/auth/reset-password');
    }
    console.log('[proxy] forwarding code to callback:', url.toString());
    return NextResponse.redirect(url);
  }

  // Refresh session and get user
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/verify', '/auth/callback', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // If not logged in and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access auth pages (except callback), redirect appropriately
  if (user && isPublicRoute && pathname !== '/auth/callback' && pathname !== '/auth/reset-password') {
    // Check if onboarding is complete
    const { data: household } = await supabase
      .from('households')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    const url = request.nextUrl.clone();
    if (!household?.onboarding_completed) {
      url.pathname = '/onboarding';
    } else {
      url.pathname = '/';
    }
    return NextResponse.redirect(url);
  }

  // If logged in, not on auth pages, and not on onboarding - check onboarding status
  if (user && !isPublicRoute && !isOnboardingRoute) {
    const { data: household } = await supabase
      .from('households')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    // If no household or onboarding not completed, redirect to onboarding
    if (!household?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
};

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
