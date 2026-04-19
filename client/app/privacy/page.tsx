import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – EmberTales',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective date: 17 April 2026 &nbsp;·&nbsp; EmberTales (Beta)
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              EmberTales is operated by Isis Desade, based in Sydney, New South Wales, Australia
              (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). We are committed to protecting the privacy of all users,
              especially children. This Privacy Policy explains what personal information we collect,
              why we collect it, and how we use and protect it.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              This policy is governed by the{' '}
              <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).
              Because the Service involves children, we also apply practices consistent with
              children&apos;s privacy best practice, including those reflected in the US Children&apos;s
              Online Privacy Protection Act (COPPA), for any users in applicable jurisdictions.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">2. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              EmberTales is designed for use by children under the supervision of a parent or
              guardian. <strong>Children do not create their own accounts.</strong> A parent or
              guardian (18+) creates the household account and sets up Reader profiles for each
              child.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              By creating a Reader profile for a child, the parent or guardian consents to the
              collection and use of that child&apos;s information as described in this policy. We do not
              knowingly collect personal information directly from children. If you believe a child
              has provided us with personal information without parental consent, please contact us
              immediately at{' '}
              <a href="mailto:isisdesade@gmail.com" className="underline hover:text-foreground">
                isisdesade@gmail.com
              </a>{' '}
              and we will delete it promptly.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">3. Information We Collect</h2>

            <h3 className="font-medium mt-4 mb-1">Account information (Parent)</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Name and email address (provided at sign-up or via Google OAuth)</li>
              <li>Password (stored in hashed form; we never store it in plain text)</li>
            </ul>

            <h3 className="font-medium mt-4 mb-1">Reader profiles (Children)</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Reader name (chosen by the parent)</li>
              <li>Reading progress and session history</li>
            </ul>

            <h3 className="font-medium mt-4 mb-1">Uploaded content</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>PDF files you upload to the library</li>
            </ul>

            <h3 className="font-medium mt-4 mb-1">Voice session data</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Audio transmitted during a reading session is processed in real time by our AI voice service to generate narration and responses. We do not permanently store raw audio recordings of children.</li>
            </ul>

            <h3 className="font-medium mt-4 mb-1">Usage and technical data</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Log data (IP address, browser type, pages visited, timestamps)</li>
              <li>Device type and operating system</li>
              <li>Crash reports and performance data</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">4. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>To create and manage your account and Reader profiles</li>
              <li>To store and serve your uploaded books</li>
              <li>To power AI voice narration and interactive reading sessions</li>
              <li>To track and display reading progress</li>
              <li>To send transactional emails (e.g. email verification, password reset)</li>
              <li>To diagnose bugs and improve the Service</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not use your information or your children&apos;s information for advertising,
              profiling, or any automated decision-making that produces legal or similarly
              significant effects.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              To provide the Service we rely on the following sub-processors. Each processes data
              only to the extent necessary to deliver their function:
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-medium text-sm">Supabase</p>
                <p className="text-muted-foreground text-sm">
                  Authentication, database (account and progress data), and file storage (uploaded
                  PDFs). Data is hosted in Australia where possible; see Supabase&apos;s privacy policy
                  for details.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Pipecat AI / AI Voice Provider</p>
                <p className="text-muted-foreground text-sm">
                  Real-time AI voice narration and conversational responses during reading sessions.
                  Audio is streamed and processed in real time.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Daily.co (WebRTC)</p>
                <p className="text-muted-foreground text-sm">
                  Provides the real-time audio transport layer for reading sessions.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Vercel</p>
                <p className="text-muted-foreground text-sm">
                  Hosts and serves the web application front end.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">Google (OAuth)</p>
                <p className="text-muted-foreground text-sm">
                  Optional sign-in via Google. If you choose &quot;Continue with Google&quot;, Google shares
                  your name and email with us. We do not receive your Google password.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not sell your personal information or your children&apos;s personal information to
              any third party, and we do not share it for advertising purposes.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your account data and uploaded content for as long as your account is
              active. When you delete your account, we will delete your personal information and
              all associated Reader profiles and uploaded content within 30 days, unless we are
              required by law to retain it longer.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can delete individual books or Reader profiles at any time from within the app.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">7. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We apply industry-standard security measures including encrypted connections (HTTPS),
              hashed passwords, and access controls. However, no system is completely secure. If
              you have security concerns, please contact us immediately.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under the Australian Privacy Principles you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
              <li><strong>Access</strong> the personal information we hold about you or your child</li>
              <li><strong>Correct</strong> inaccurate or out-of-date information</li>
              <li><strong>Delete</strong> your account and associated data</li>
              <li><strong>Complain</strong> to the Office of the Australian Information Commissioner (OAIC) if you believe we have mishandled your data</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:isisdesade@gmail.com" className="underline hover:text-foreground">
                isisdesade@gmail.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some of our third-party service providers operate outside Australia. Where data is
              transferred internationally, we take reasonable steps to ensure it receives
              equivalent privacy protection.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you by email or
              in-app notice before material changes take effect. Continued use of the Service after
              the effective date constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              Privacy questions, access requests, or complaints:
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>Isis Desade</strong>
              <br />
              Sydney, New South Wales, Australia
              <br />
              <a href="mailto:isisdesade@gmail.com" className="underline hover:text-foreground">
                isisdesade@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground underline">
            Terms of Service
          </Link>
          <Link href="/auth/login" className="hover:text-foreground underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
