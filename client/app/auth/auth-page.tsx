'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmberLogo } from '@/components/EmberLogo';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export const AuthPage = ({ mode }: AuthPageProps) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    if (activeTab === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      router.push('/auth/verify');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setIsGoogleLoading(false);
    }
  };

  const switchTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'login') {
      router.push('/auth/login');
    } else {
      router.push('/auth/signup');
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-4">
      {/* Logo & Mascot */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-3 mb-4">
          <EmberLogo size={40} className="text-primary shrink-0" />
          <div>
            <h1 className="font-[family-name:var(--font-marcellus)] text-2xl font-bold text-foreground leading-tight">
              EmberTales
            </h1>
            <p className="text-sm text-muted-foreground">Stories, read together</p>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
        >
          <Image
            src="/images/ember-dragon.png"
            alt="Ember the dragon"
            width={160}
            height={160}
            className="w-full h-full object-cover"
            priority
          />
        </motion.div>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-sm p-6">
        {/* Tabs */}
        <div className="flex mb-6 bg-muted rounded-xl p-1">
          <button
            onClick={() => switchTab('login')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'login'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => switchTab('signup')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'signup'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-semibold gap-3 mb-4"
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading}
        >
          <GoogleIcon />
          {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
        </Button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card px-3 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {activeTab === 'signup' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="pl-10 h-12"
                required={activeTab === 'signup'}
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="pl-10 h-12"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="pl-10 pr-10 h-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {activeTab === 'login' && (
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-accent font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isLoading}
          >
            {isLoading
              ? activeTab === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : activeTab === 'login'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-5">
          By continuing you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
