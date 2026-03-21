import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const proxy = async (request: NextRequest) => {
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

  // Refresh session cookies (required by Supabase SSR)
  await supabase.auth.getUser();

  // DEV: auth check bypassed — uncomment to enforce protected routes
  // const { data: { user } } = await supabase.auth.getUser();
  // const { pathname } = request.nextUrl;
  // const isProtected = pathname.startsWith('/h/');
  // if (!user && isProtected) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/';
  //   return NextResponse.redirect(url);
  // }

  return supabaseResponse;
};

export const config = {
  matcher: ['/h/:path*'],
};
