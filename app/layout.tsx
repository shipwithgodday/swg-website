import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { SiteNavbar, SiteFooter } from '@/components/shared/SiteChrome';
import { GoogleAnalytics } from '@next/third-parties/google';
import { WebVitals } from '@/components/analytics/WebVitals';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/lib/cart-context';

export const metadata: Metadata = {
  title: {
    default: 'Ship With Godday | Lucky Godday Business Services',
    template: '%s | Ship With Godday',
  },
  description:
    'Your trusted partner for seamless shipping solutions between China and Ghana. Experience reliable logistics, procurement, and payment services tailored to your business needs.',
  keywords: [
    'shipping',
    'logistics',
    'Ghana',
    'China',
    'procurement',
    'international trade',
    'cargo',
    'freight',
    'import',
    'export',
  ],
  authors: [{ name: 'Godday' }],
  creator: 'Godday',
  publisher: 'Lucky Godday Business Services',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://shipwithgodday.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shipwithgodday.com',
    title: 'Ship With Godday | Lucky Godday Business Services',
    description:
      'Your trusted partner for seamless shipping solutions between China and Ghana. Experience reliable logistics, procurement, and payment services tailored to your business needs.',
    siteName: 'Ship With Godday',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Ship With Godday Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ship With Godday | Lucky Godday Business Services',
    description:
      'Your trusted partner for seamless shipping solutions between China and Ghana.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <CartProvider>
            <SiteNavbar />
            {children}
            <SiteFooter />
          </CartProvider>
          <WebVitals />
          <Toaster />
        </body>
        <GoogleAnalytics gaId="G-GHJH5C564E" />
      </html>
    </ClerkProvider>
  );
}
