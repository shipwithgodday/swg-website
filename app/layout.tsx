import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import {
  SiteNavbar,
  SiteFooter,
} from '@/components/shared/SiteChrome';
import { GoogleAnalytics } from '@next/third-parties/google';
import { WebVitals } from '@/components/analytics/WebVitals';
import { Toaster } from '@/components/ui/sonner';
import { CartProvider } from '@/lib/cart-context';

export const metadata: Metadata = {
  title: {
    default: 'Ship With Godday',
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
  publisher: 'Ship With Godday',
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
    title: 'Ship With Godday',
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
    title: 'Ship With Godday',
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
    <ClerkProvider
      signUpUrl="/sign-up"
      appearance={{
        elements: {
          // Hide the 'Secured by Clerk' badge in the UserButton /
          // account popover. The badge on auth cards (sign-in / sign-up
          // modals, /sign-in) has no element descriptor, so it's hidden
          // via CSS in globals.css — that approach keeps the card's
          // footer actions (e.g. the "Sign up" link) visible, which
          // hiding the whole `footer` element would not.
          userButtonPopoverFooter: { display: 'none' },
        },
      }}>
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
