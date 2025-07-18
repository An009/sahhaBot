import './globals.css';
import type { Metadata } from 'next';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SahhaBot" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0066cc" />
      </head>
      <body className="font-inter">{children}</body>
    </html>
  );
}