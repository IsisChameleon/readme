'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Client-side auth confirm page.
 *
 * When the URL contains ?code=, the Supabase browser client auto-detects it
 * during initialization and exchanges it for a session using the PKCE code
 * verifier stored in document.cookie — no server roundtrip needed.
 *
 * The server-side /auth/callback route can't reliably access browser cookies
 * through Docker's proxy chain, so this page handles the exchange client-side.
 */
export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.push('/auth/reset-password');
      } else if (event === 'SIGNED_IN') {
        router.push('/');
      }
    });

    // If no code in URL or exchange already failed, redirect after timeout
    const timeout = setTimeout(() => {
      router.push('/auth/login');
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-4">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary-foreground">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>
      <p className="text-muted-foreground">Verifying...</p>
    </div>
  );
}
