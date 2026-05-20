import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { CartView } from '@/components/shop/CartView';
import { MotionReveal } from '@/components/shop/MotionReveal';

export const metadata: Metadata = { title: 'Cart' };

export default function CartPage() {
  return (
    <Container className="py-12 md:py-16">
      <MotionReveal className="max-w-3xl">
        <SectionHeader highlightedWord="cart" size="lg">
          Your cart
        </SectionHeader>
        <p className="mt-3 text-lg font-light text-muted-foreground">
          Review your items before heading to checkout.
        </p>
      </MotionReveal>
      <MotionReveal className="mt-8 max-w-2xl" delay={0.1}>
        <CartView />
      </MotionReveal>
    </Container>
  );
}
