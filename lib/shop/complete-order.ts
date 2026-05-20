import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, productVariants } from '@/lib/db/schema';
import { sendOrderConfirmationEmail } from '@/lib/shop/order-email';

export type CompleteOrderResult =
  | { status: 'claimed' }
  | { status: 'already_paid' }
  | { status: 'not_found' }
  | {
      status: 'amount_mismatch';
      expected: number;
      received: number;
    };

/**
 * Idempotently advance a `pending` order to `paid`, decrement stock and
 * fire the confirmation email. Safe to call from both the Paystack webhook
 * and the post-payment callback page — whichever wins the atomic claim
 * runs the side effects exactly once; the other returns `already_paid`.
 *
 * Reads the order by its `orderNumber` (which is the Paystack reference).
 * `paidAmount` is the amount Paystack reports having charged, in pesewas.
 */
export async function completeOrder(
  orderNumber: string,
  paidAmount: number
): Promise<CompleteOrderResult> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber));
  if (!order) return { status: 'not_found' };

  if (paidAmount !== order.total) {
    console.error(
      `completeOrder: amount mismatch for ${order.orderNumber} — ` +
        `charged ${paidAmount}, expected ${order.total}`
    );
    return {
      status: 'amount_mismatch',
      expected: order.total,
      received: paidAmount,
    };
  }

  if (order.status !== 'pending') return { status: 'already_paid' };

  // The WHERE guard + RETURNING is what makes the claim atomic across
  // concurrent webhook/callback deliveries: only one row update can
  // succeed; the other sees an empty `claimed`.
  const claimed = await db
    .update(orders)
    .set({ status: 'paid', updatedAt: new Date() })
    .where(
      sql`${orders.id} = ${order.id} AND ${orders.status} = 'pending'`
    )
    .returning({ id: orders.id });
  if (claimed.length === 0) return { status: 'already_paid' };

  // We won the claim — decrement stock exactly once, guarded against
  // overselling.
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  for (const it of items) {
    await db
      .update(productVariants)
      .set({
        stockQuantity: sql`${productVariants.stockQuantity} - ${it.quantity}`,
      })
      .where(
        sql`${productVariants.id} = ${it.variantId} AND ${productVariants.stockQuantity} >= ${it.quantity}`
      );
  }

  // Best-effort confirmation email — never blocks the claim.
  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (error) {
    console.error('completeOrder: email send failed', error);
  }

  return { status: 'claimed' };
}
