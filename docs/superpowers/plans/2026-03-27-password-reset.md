# Password Reset Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add password reset flow so users who forget their password can recover their account via email.

**Architecture:** Two new pages + callback update. Supabase handles the email/token. The flow is: login page → forgot password → enter email → Supabase sends reset link → user clicks link → callback exchanges token → redirect to reset page → user sets new password → redirect to login.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase Auth

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `client/app/auth/forgot-password/page.tsx` | Email form, calls `resetPasswordForEmail()` |
| Create | `client/app/auth/reset-password/page.tsx` | New password form, calls `updateUser()` |
| Modify | `client/app/auth/callback/route.ts` | Detect recovery flow, redirect to reset page |

---

## Task 1: Forgot Password Page

**Files:**
- Create: `client/app/auth/forgot-password/page.tsx`

**Context:** The login page already links to `/auth/forgot-password` (line 255-261 in `auth-page.tsx`). This page needs an email input and a submit button that calls `supabase.auth.resetPasswordForEmail()`. On success, show a confirmation message. Match the visual style of the existing auth pages (centered card, EmberTales logo).

- [ ] **Step 1: Create forgot-password page**

```tsx
// client/app/auth/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
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
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold text-foreground">Check your email</h1>
              <p className="text-muted-foreground">
                We sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to set a new password.
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full mt-4">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold text-foreground mb-2">Reset password</h1>
              <p className="text-muted-foreground mb-6">
                Enter your email and we'll send you a reset link.
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
}
```

- [ ] **Step 2: Verify page renders**

Navigate to `/auth/forgot-password`. Should show email form with EmberTales logo.

- [ ] **Step 3: Commit**

```bash
git add client/app/auth/forgot-password/page.tsx
git commit -m "feat: add forgot password page"
```

---

## Task 2: Update Auth Callback for Recovery Flow

**Files:**
- Modify: `client/app/auth/callback/route.ts`

**Context:** When Supabase sends a password reset email, the link goes to `/auth/callback?code=xxx`. The callback needs to detect this is a recovery flow and redirect to `/auth/reset-password` instead of the home page. The `next` query param from the `redirectTo` option carries this info.

- [ ] **Step 1: Update callback to handle next param**

After `exchangeCodeForSession`, check for `next` query param:

```ts
// After the existing code that exchanges the code...
const next = searchParams.get('next');

// If this is a password reset flow, redirect to reset page
if (next === '/auth/reset-password') {
  return NextResponse.redirect(`${origin}/auth/reset-password`);
}
```

Add this check BEFORE the household/onboarding checks (since recovery users already have accounts).

- [ ] **Step 2: Commit**

```bash
git add client/app/auth/callback/route.ts
git commit -m "feat: handle recovery redirect in auth callback"
```

---

## Task 3: Reset Password Page

**Files:**
- Create: `client/app/auth/reset-password/page.tsx`

**Context:** This page is only reachable after clicking the email reset link (which establishes a session via callback). The user enters a new password and confirms it. Calls `supabase.auth.updateUser({ password })`. On success, redirect to login with a success message.

- [ ] **Step 1: Create reset-password page**

```tsx
// client/app/auth/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // Sign out so they log in fresh with new password
    await supabase.auth.signOut();
    router.push('/auth/login?message=password-updated');
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary-foreground">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <span className="text-2xl font-display font-bold text-foreground">EmberTales</span>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Set new password</h1>
          <p className="text-muted-foreground mb-6">
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="pl-10 pr-10 h-12"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="pl-10 h-12"
                required
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
              {isLoading ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Optionally show success message on login page**

In `auth-page.tsx`, read `?message=password-updated` from URL and show a green toast or banner. This is a nice-to-have — the redirect alone is sufficient for MVP.

- [ ] **Step 3: Verify full flow**

1. Go to `/auth/login` → click "Forgot password?"
2. Enter email → click "Send reset link"
3. Check Inbucket (`localhost:54324`) for the reset email
4. Click the link → should hit `/auth/callback` → redirect to `/auth/reset-password`
5. Enter new password + confirm → click "Update password"
6. Should redirect to `/auth/login`

- [ ] **Step 4: Commit**

```bash
git add client/app/auth/reset-password/page.tsx
git commit -m "feat: add reset password page — complete password recovery flow"
```
