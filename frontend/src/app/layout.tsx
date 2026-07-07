/**
 * Root layout: theme (light/dark from tokens), locale (en/hi), auth boundary.
 * Role routing happens in the (command)/(facility) route groups per docs/08 §1.
 */
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'SwasthyaOps AI',
  description: 'AI Command Center for District Healthcare',
  manifest: '/manifest.json', // PWA manifest from ../mobile/pwa (docs/08 §7)
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7fafd' },
    { media: '(prefers-color-scheme: dark)', color: '#101418' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
