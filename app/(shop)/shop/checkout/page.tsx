import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { MotionReveal } from '@/components/shop/MotionReveal';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const zones = await db
    .select({
      id: deliveryZones.id,
      name: deliveryZones.name,
      fee: deliveryZones.fee,
    })
    .from(deliveryZones)
    .where(eq(deliveryZones.active, true))
    .orderBy(asc(deliveryZones.name));

  return (
    <Container className="py-12 md:py-16">
      <MotionReveal className="max-w-3xl">
        <SectionHeader highlightedWord="there" size="lg">
          Almost there
        </SectionHeader>
        <p className="mt-3 text-lg font-light text-muted-foreground">
          A few details and we&apos;ll get your order on its way.
        </p>
      </MotionReveal>
      <MotionReveal className="mt-10" delay={0.1}>
        <CheckoutForm zones={zones} />
      </MotionReveal>
    </Container>
  );
}
