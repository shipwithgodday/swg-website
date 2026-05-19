'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { deliveryZoneSchema } from '@/lib/shop/validation';
import type { ActionResult } from './categories';

const ZONES_PATH = '/admin/settings/delivery-zones';

export async function createDeliveryZone(
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = deliveryZoneSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await db.insert(deliveryZones).values(parsed.data);
  revalidatePath(ZONES_PATH);
  return { ok: true };
}

export async function updateDeliveryZone(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = deliveryZoneSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await db
    .update(deliveryZones)
    .set(parsed.data)
    .where(eq(deliveryZones.id, id));
  revalidatePath(ZONES_PATH);
  return { ok: true };
}
