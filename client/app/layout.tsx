import type { Metadata } from 'next';
import { Caveat, Nunito } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'] });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'readme – stories read together',
  description: 'Voice-first reading companion for kids',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${caveat.variable} ${nunito.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
