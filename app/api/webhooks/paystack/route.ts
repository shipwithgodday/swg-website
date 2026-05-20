import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, orderItems, productVariants } from '@/lib/db/schema';
import { verifyPaystackSignature } from '@/lib/shop/paystack';
import { sendOrderConfirmationEmail } from '@/lib/shop/order-email';

// Paystack delivers many event shapes; we only act on `charge.success`,
// which always carries `data.reference` and `data.amount`. We parse with
// `.passthrough()` so future fields don't break the webhook.
const paystackEventSchema = z
  .object({
    event: z.string(),
    data: z
      .object({
        reference: z.string().min(1),
        amount: z.number().int().nonnegative(),
      })
      .passthrough(),
  })
  .passthrough();

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('paystack webhook: PAYSTACK_SECRET_KEY not set');
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? '';
  if (!verifyPaystackSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const parsed = paystackEventSchema.safeParse(raw);
  // Acknowledge non-charge or unrecognised payloads — Paystack retries on
  // non-2xx, and we don't want them retrying events we don't care about.
  if (!parsed.success || parsed.data.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }
  const { reference, amount } = parsed.data.data;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, reference));

  if (!order) {
    console.warn(`paystack webhook: unknown reference ${reference}`);
    return NextResponse.json({ received: true });
  }

  // Verify Paystack charged the amount we expect before trusting it.
  if (amount !== order.total) {
    console.error(
      `paystack webhook: amount mismatch for ${reference} — ` +
        `charged ${amount}, expected ${order.total}`
    );
    return NextResponse.json({ received: true });
  }

  // Already processed — fast idempotent no-op.
  if (order.status !== 'pending') {
    return NextResponse.json({ received: true });
  }

  // Atomically claim the order: flip pending -> paid. The guarded WHERE
  // plus RETURNING means only ONE webhook delivery can win this, even
  // under concurrent or replayed deliveries.
  const claimed = await db
    .update(orders)
    .set({ status: 'paid', updatedAt: new Date() })
    .where(
      sql`${orders.id} = ${order.id} AND ${orders.status} = 'pending'`
    )
    .returning({ id: orders.id });

  if (claimed.length === 0) {
    // A concurrent or earlier delivery already processed this order.
    return NextResponse.json({ received: true });
  }

  // We won the claim — decrement stock exactly once. Each decrement is
  // guarded against overselling (WHERE stock >= quantity).
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

  // Best-effort confirmation email — never blocks the webhook.
  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (error) {
    console.error('paystack webhook: email send failed', error);
  }

  return NextResponse.json({ received: true });
}
