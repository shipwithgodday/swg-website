import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { DeliveryZonesEditor } from '@/components/admin/DeliveryZonesEditor';

export default async function DeliveryZonesPage() {
  const zones = await db
    .select()
    .from(deliveryZones)
    .orderBy(asc(deliveryZones.name));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Delivery zones</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fees customers pay by region. Deactivate a zone to hide it from
        checkout without affecting past orders.
      </p>
      <div className="mt-6 max-w-2xl">
        <DeliveryZonesEditor
          zones={zones.map((z) => ({
            id: z.id,
            name: z.name,
            fee: z.fee,
            active: z.active,
          }))}
        />
      </div>
    </div>
  );
}
