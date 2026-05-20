import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { SignInCard } from '@/components/shop/SignInCard';
import { MotionReveal } from '@/components/shop/MotionReveal';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const { userId } = await auth();

  const zones = userId
    ? await db
        .select({
          id: deliveryZones.id,
          name: deliveryZones.name,
          fee: deliveryZones.fee,
        })
        .from(deliveryZones)
        .where(eq(deliveryZones.active, true))
        .orderBy(asc(deliveryZones.name))
    : [];

  return (
    <>
      <PageHero
        title="Almost there"
        highlightedWord="there"
        subtitle="A few details and we'll get your order on its way."
      />

      <Container className="py-12 md:py-16">
        <MotionReveal>
          {userId ? (
            <CheckoutForm zones={zones} />
          ) : (
            <div className="mx-auto max-w-xl">
              <SignInCard
                title="Sign in to check out"
                description="We use your account to attach this order to your shipping mark and keep a record of your purchases."
                redirectUrl="/shop/checkout"
              />
            </div>
          )}
        </MotionReveal>
      </Container>
    </>
  );
}
