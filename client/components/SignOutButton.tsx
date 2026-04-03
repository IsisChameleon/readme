'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const SignOutButton = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
    >
      Sign out
    </button>
  );
};
