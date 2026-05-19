'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { canTransition } from '@/lib/shop/order-status';
import type { ActionResult } from './categories';

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<ActionResult> {
  await requireAdmin();
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return { ok: false, error: 'Order not found.' };

  if (!canTransition(order.status, newStatus)) {
    return {
      ok: false,
      error: `Cannot change an order from "${order.status}" to "${newStatus}".`,
    };
  }

  await db
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
