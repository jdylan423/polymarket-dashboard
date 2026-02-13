import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Laundromat Calculator Dashboard',
  description: 'Deal ROI, cash flow, and comparison dashboard',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={jetBrainsMono.className + ' bg-mc-bg text-mc-text min-h-screen'}>{children}</body>
    </html>
  );
}
