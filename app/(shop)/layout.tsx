import { CartProvider } from '@/lib/cart-context';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
