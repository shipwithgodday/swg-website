import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DeliveryZonesEditor } from '@/components/admin/DeliveryZonesEditor';

export default async function DeliveryZonesPage() {
  const zones = await db
    .select()
    .from(deliveryZones)
    .orderBy(asc(deliveryZones.name));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Delivery zones"
        description="Fees customers pay by region. Deactivate a zone to hide it from checkout without affecting past orders."
      />
      <div className="max-w-2xl">
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
