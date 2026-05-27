import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { CartView } from '@/components/shop/CartView';
import { MotionReveal } from '@/components/shared/MotionReveal';

export const metadata: Metadata = { title: 'Cart' };

export default function CartPage() {
  return (
    <>
      <PageHero
        title="Your cart"
        highlightedWord="cart"
        subtitle="Review your items before heading to checkout."
      />
      <Container className="py-12 md:py-16">
        <MotionReveal className="max-w-2xl">
          <CartView />
        </MotionReveal>
      </Container>
    </>
  );
}
