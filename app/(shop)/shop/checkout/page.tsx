import type { Metadata } from 'next';
import { auth, currentUser } from '@clerk/nextjs/server';
import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { MotionReveal } from '@/components/shared/MotionReveal';
import { getCheckoutPrefill } from '@/lib/shop/orders';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const { userId } = await auth();

  // Returning, signed-in customers get their delivery details pre-filled
  // from their most recent order so they don't retype everything.
  const user = userId ? await currentUser() : null;
  const prefill = userId && user
    ? await getCheckoutPrefill(userId, user)
    : null;

  return (
    <>
      <PageHero
        title="Almost there"
        highlightedWord="there"
        subtitle="A few details and we'll get your order on its way."
      />

      <Container className="py-12 md:py-16">
        <MotionReveal>
          <CheckoutForm signedIn={!!userId} prefill={prefill ?? undefined} />
        </MotionReveal>
      </Container>
    </>
  );
}
