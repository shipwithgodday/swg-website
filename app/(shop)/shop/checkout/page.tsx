import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import Container from '@/components/shared/container';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { CheckoutForm } from '@/components/shop/CheckoutForm';

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
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-8">
        <CheckoutForm zones={zones} />
      </div>
    </Container>
  );
}
