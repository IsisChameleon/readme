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

  // If any page receives a ?code= param, forward to the client-side confirm page.
  // The browser client handles the PKCE code exchange using the code verifier
  // stored in document.cookie — the server-side callback can't reliably access it
  // through Docker's proxy chain.
  const code = request.nextUrl.searchParams.get('code');
  if (code && pathname !== '/auth/callback' && pathname !== '/auth/confirm') {
    const host = request.headers.get('host') || request.nextUrl.host;
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const url = new URL(`${proto}://${host}${pathname}`);
    url.pathname = '/auth/confirm';
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    console.log('[proxy] forwarding code to confirm:', url.toString());
    return NextResponse.redirect(url);
  }

  // /auth/callback and /auth/confirm handle their own auth — skip getUser()
  if (pathname === '/auth/callback' || pathname === '/auth/confirm') {
    return supabaseResponse;
  }

  // Refresh session and get user
  const { data: { user } } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/verify', '/auth/callback', '/auth/confirm', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  // If not logged in and trying to access protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access auth pages (except callback), redirect appropriately
  if (user && isPublicRoute && pathname !== '/auth/callback' && pathname !== '/auth/confirm' && pathname !== '/auth/reset-password') {
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
