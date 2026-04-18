import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – EmberTales',
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Effective date: 17 April 2026 &nbsp;·&nbsp; EmberTales (Beta)
          </p>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">1. About EmberTales</h2>
            <p className="text-muted-foreground leading-relaxed">
              EmberTales is a voice-interactive reading companion that lets parents upload books and
              have them narrated aloud to children by an AI voice. These Terms of Service
              ("Terms") govern your access to and use of the EmberTales application and any related
              services (collectively, the "Service"). The Service is currently in a private beta
              phase, available by invitation only.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              EmberTales is operated by Isis Desade, an individual based in Sydney, New South Wales,
              Australia ("we", "us", or "our"). By creating an account or using the Service you
              agree to be bound by these Terms.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">2. Who May Use EmberTales</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 18 years old to create an EmberTales account. Accounts are
              intended for parents or legal guardians ("Parents") who set up a household and manage
              reader profiles on behalf of their children ("Readers"). Children do not create their
              own accounts; they access the Service through a Reader profile created and controlled
              by a Parent.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              By creating an account you confirm that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
              <li>you are 18 years of age or older;</li>
              <li>you have the legal authority to agree to these Terms on your own behalf and on behalf of any Reader profiles you create; and</li>
              <li>all information you provide is accurate and up to date.</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">3. Beta Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              EmberTales is currently provided as an early-access beta. This means features may
              change, be removed, or be temporarily unavailable without notice. We do not guarantee
              uninterrupted access and accept no liability for downtime or data loss during the beta
              period. We may discontinue the beta at any time.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">4. Your Account</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for keeping your account credentials secure. You must not share
              your password or allow others (other than children in your household) to use your
              account. Notify us immediately at{' '}
              <a href="mailto:isisdesade@gmail.com" className="underline hover:text-foreground">
                isisdesade@gmail.com
              </a>{' '}
              if you suspect unauthorised access.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Content You Upload</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may upload PDF books to the Service for personal, household use. By uploading
              content you represent and warrant that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
              <li>you own the content, or hold a licence that permits you to use it in this way;</li>
              <li>uploading and using the content via EmberTales does not infringe any copyright, trademark, or other intellectual property right of any third party; and</li>
              <li>the content is suitable for the child audience it is intended for.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not grant you any licence to upload copyrighted works you do not own. We may
              remove content that we reasonably believe infringes third-party rights. We also offer
              a selection of copyright-free demo books for your use.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You retain ownership of all content you upload. You grant us a limited, non-exclusive
              licence to store, process, and transmit your content solely to provide the Service.
              This licence ends when you delete the content or close your account.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">6. AI Voice Technology</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service uses artificial intelligence and third-party voice technology to narrate
              books and respond to questions from Readers. AI-generated narration may contain
              errors. It is not a substitute for parental involvement in your child's reading
              experience. We encourage Parents to review books before assigning them to Readers.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">7. Prohibited Uses</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must not use the Service to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
              <li>upload content that is illegal, harmful, abusive, or inappropriate for children;</li>
              <li>infringe any third-party intellectual property rights;</li>
              <li>attempt to reverse-engineer, scrape, or extract data from the Service;</li>
              <li>use the Service for any commercial purpose without our written consent; or</li>
              <li>violate any applicable law or regulation.</li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">8. Our Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The EmberTales name, logo, interface design, and all software are our property or
              licensed to us. Nothing in these Terms transfers any intellectual property rights to
              you, other than the limited right to use the Service as described.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, the Service is provided "as is" and "as
              available" without warranties of any kind, express or implied. We do not warrant that
              the Service will be error-free, secure, or always available.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Nothing in these Terms excludes any rights you may have under Australian Consumer Law
              that cannot be excluded by contract.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, our total liability to you for any loss
              arising from your use of the Service is limited to AUD $0, reflecting that the Service
              is currently free of charge. We are not liable for indirect, consequential, or
              incidental losses of any kind.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may close your account at any time by contacting us. We may suspend or terminate
              your access if you breach these Terms or if we decide to end the beta programme.
              On termination your content will be deleted within a reasonable period.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">12. Changes to These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify you by email or an
              in-app notice before material changes take effect. Continued use of the Service after
              the effective date of any change constitutes your acceptance of the updated Terms.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws of New South Wales, Australia. Any disputes
              will be subject to the exclusive jurisdiction of the courts of New South Wales.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-semibold mb-2">14. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about these Terms?{' '}
              <a href="mailto:isisdesade@gmail.com" className="underline hover:text-foreground">
                isisdesade@gmail.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground underline">
            Privacy Policy
          </Link>
          <Link href="/auth/login" className="hover:text-foreground underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
