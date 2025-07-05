import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SahhaBot - مساعد طبي',
  description: 'مساعد طبي ذكي للمناطق الريفية في المغرب',
  manifest: '/manifest.json',
  themeColor: '#0066cc',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SahhaBot" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0066cc" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}