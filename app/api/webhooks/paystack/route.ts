import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, productVariants } from '@/lib/db/schema';
import { verifyPaystackSignature } from '@/lib/shop/paystack';
import { sendOrderConfirmationEmail } from '@/lib/shop/order-email';

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

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  // Acknowledge anything that is not a successful charge.
  if (event.event !== 'charge.success' || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  const reference = event.data.reference;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, reference));

  if (!order) {
    console.warn(`paystack webhook: unknown reference ${reference}`);
    return NextResponse.json({ received: true });
  }

  // Already processed — idempotent no-op.
  if (order.status !== 'pending') {
    return NextResponse.json({ received: true });
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  // Atomically: flip status (guarded so a replay updates 0 rows) and
  // decrement each variant's stock (guarded against overselling).
  await db.batch([
    db
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(
        sql`${orders.id} = ${order.id} AND ${orders.status} = 'pending'`
      ),
    ...items.map((it) =>
      db
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} - ${it.quantity}`,
        })
        .where(
          sql`${productVariants.id} = ${it.variantId} AND ${productVariants.stockQuantity} >= ${it.quantity}`
        )
    ),
  ]);

  // Best-effort confirmation email — never blocks the webhook.
  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (error) {
    console.error('paystack webhook: email send failed', error);
  }

  return NextResponse.json({ received: true });
}
