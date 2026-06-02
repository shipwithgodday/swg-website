import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { MotionReveal } from '@/components/shared/MotionReveal';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const { userId } = await auth();

  return (
    <>
      <PageHero
        title="Almost there"
        highlightedWord="there"
        subtitle="A few details and we'll get your order on its way."
      />

      <Container className="py-12 md:py-16">
        <MotionReveal>
          <CheckoutForm signedIn={!!userId} />
        </MotionReveal>
      </Container>
    </>
  );
}
