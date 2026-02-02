import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stock and Profit Tracker',
  description: 'Inventory and profit tracking app for resellers.',
  metadataBase: new URL('https://stock-and-profit-tracker.vercel.app/'),
  openGraph: {
    images: [
      {
        url: 'https://yhqxhbbwbcaounwmzuqa.supabase.co/storage/v1/object/public/Images/stock%20track.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://yhqxhbbwbcaounwmzuqa.supabase.co/storage/v1/object/public/Images/stock%20track.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
