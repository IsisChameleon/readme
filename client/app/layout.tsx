import type { Metadata } from 'next';
import { Baloo_2, Nunito, Marcellus } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';

const baloo = Baloo_2({ variable: '--font-baloo', subsets: ['latin'] });
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'] });
const marcellus = Marcellus({ weight: '400', variable: '--font-marcellus', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EmberTales – stories read together',
  description: 'Voice-first reading companion for kids',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="ember">
      <body className={`${baloo.variable} ${nunito.variable} ${marcellus.variable} antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
