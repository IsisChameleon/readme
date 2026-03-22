import type { Metadata } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const baloo = Baloo_2({ variable: '--font-baloo', subsets: ['latin'] });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EmberTales – stories read together',
  description: 'Voice-first reading companion for kids',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  return (
    <html lang="en" data-theme="ember">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__NEXT_PUBLIC_API_BASE_URL__ = ${JSON.stringify(apiBaseUrl)};`,
          }}
        />
      </head>
      <body className={`${baloo.variable} ${nunito.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
