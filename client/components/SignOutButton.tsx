'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{
        color: 'var(--db-muted-fg)',
        fontFamily: 'var(--font-nunito)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--db-muted)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      Sign out
    </button>
  );
};
