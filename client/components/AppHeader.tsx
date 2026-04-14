'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EmberLogo } from './EmberLogo';

interface AppHeaderProps {
  backHref?: string;
  right?: ReactNode;
  subtitle?: string;
  hideWordmarkSm?: boolean;
}

export const AppHeader = ({
  backHref,
  right,
  subtitle = 'Stories, read together',
  hideWordmarkSm = true,
}: AppHeaderProps) => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3 shrink-0">
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <EmberLogo size={40} className="text-primary shrink-0" />
          <div className={hideWordmarkSm ? 'hidden sm:block' : ''}>
            <h1 className="font-[family-name:var(--font-marcellus)] text-2xl font-bold text-foreground leading-tight">
              EmberTales
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
      </div>
    </header>
  );
};
