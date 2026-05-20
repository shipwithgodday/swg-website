import { CartProvider } from '@/lib/cart-context';

/**
 * The marketing navbar is `position: fixed` and overlays the page, so shop
 * pages need top padding to clear it (the home/about pages do this via their
 * hero sections).
 */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="pt-24 md:pt-32">{children}</div>
    </CartProvider>
  );
}
