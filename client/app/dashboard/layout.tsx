import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/SignOutButton';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devUser = (user ?? { email: 'dev@localhost', id: 'dev' }) as any;

  return (
    <div className="dashboard-dark min-h-screen" style={{ background: 'var(--db-bg)' }}>
      {/* Header banner */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--db-card-border)' }}
      >
        <h1
          className="text-4xl"
          style={{ fontFamily: 'var(--font-caveat)', color: 'var(--db-primary)' }}
        >
          readme
        </h1>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ background: 'var(--db-accent)' }}
          >
            {devUser.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <SignOutButton />
        </div>
      </header>

      {children}
    </div>
  );
}
