'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=%2Fauth%2Freset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'recovery',
    });

    if (error) {
      setError(error.message);
      setIsVerifying(false);
      return;
    }

    router.push('/auth/reset-password');
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary-foreground">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <span className="text-2xl font-display font-bold text-foreground">EmberTales</span>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          {sent ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold text-foreground">Check your email</h1>
                <p className="text-muted-foreground">
                  We sent a code to <strong>{email}</strong>.
                  Enter it below to reset your password.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="6-digit code"
                    className="pl-10 h-12 text-center tracking-widest text-lg"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isVerifying || otpCode.length !== 6}
                >
                  {isVerifying ? 'Verifying...' : 'Verify code'}
                </Button>
              </form>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-accent font-medium hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Reset password</h1>
              <p className="text-muted-foreground mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="pl-10 h-12"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link href="/auth/login" className="text-sm text-accent font-medium hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
