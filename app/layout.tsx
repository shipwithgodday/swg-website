import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/shared/navbar';
import { ClerkProvider } from '@clerk/nextjs';
import Footer from '@/components/shared/Footer';

export const metadata: Metadata = {
  title: 'Lucky Godday Business Services',
  description: 'Ship with Godday',
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
          <Navbar />
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
