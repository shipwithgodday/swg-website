import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import { CartView } from '@/components/shop/CartView';

export const metadata: Metadata = { title: 'Cart' };

export default function CartPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">Your cart</h1>
      <div className="mt-8 max-w-xl">
        <CartView />
      </div>
    </Container>
  );
}
