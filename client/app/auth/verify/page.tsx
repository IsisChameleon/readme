import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyPage() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Check your email
          </h1>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent you a verification link. Please check your inbox and
            click the link to verify your email address.
          </p>

          <div className="space-y-3">
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Didn&apos;t receive the email? Check your spam folder or try signing
            up again.
          </p>
        </div>
      </div>
    </div>
  );
}
