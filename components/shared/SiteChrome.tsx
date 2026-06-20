'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/shared/navbar';
import Footer from '@/components/shared/Footer';

/**
 * Renders the public marketing navbar/footer, but skips them on
 * admin routes which have their own sidebar layout.
 */
export function SiteNavbar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/swg-admin')) return null;
  return <Navbar />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/swg-admin')) return null;
  return <Footer />;
}
