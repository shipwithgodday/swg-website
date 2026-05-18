import { db } from '../lib/db';
import { deliveryZones } from '../lib/db/schema';

// Fees in pesewas (GHS minor units).
const ZONES = [
  { name: 'Greater Accra', fee: 3000 },
  { name: 'Ashanti', fee: 6000 },
  { name: 'Western', fee: 7000 },
  { name: 'Central', fee: 6000 },
  { name: 'Eastern', fee: 6000 },
  { name: 'Volta', fee: 8000 },
  { name: 'Northern', fee: 12000 },
  { name: 'Other Regions', fee: 12000 },
];

async function main() {
  const existing = await db
    .select({ name: deliveryZones.name })
    .from(deliveryZones);
  const have = new Set(existing.map((z) => z.name));
  const toInsert = ZONES.filter((z) => !have.has(z.name));
  if (toInsert.length === 0) {
    console.log('Delivery zones already seeded.');
    process.exit(0);
  }
  await db.insert(deliveryZones).values(
    toInsert.map((z) => ({ name: z.name, fee: z.fee, active: true }))
  );
  console.log(`Seeded ${toInsert.length} delivery zone(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
