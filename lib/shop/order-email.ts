import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { formatCedis } from '@/lib/shop/money';
import resend from '@/lib/emails';

const FROM = 'Ship With Godday <info@shipwithgodday.com>';

/**
 * Builds and sends the order confirmation email. Best-effort: every
 * failure mode is logged so we can see what happened next time, but
 * nothing throws — the caller (webhook / callback page) must never be
 * blocked by an email problem.
 */
export async function sendOrderConfirmationEmail(
  orderId: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error(
      `sendOrderConfirmationEmail: RESEND_API_KEY not set; skipping order ${orderId}`
    );
    return;
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) {
    console.error(
      `sendOrderConfirmationEmail: order ${orderId} not found`
    );
    return;
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId));
  if (!customer?.email) {
    console.warn(
      `sendOrderConfirmationEmail: no email on customer for ${order.orderNumber}; skipping`
    );
    return;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.productName} (${i.variantName}) × ${i.quantity}</td>` +
        `<td style="text-align:right">${formatCedis(
          i.unitPrice * i.quantity
        )}</td></tr>`
    )
    .join('');

  const html = `
    <h2>Thank you for your order</h2>
    <p>Order <strong>${order.orderNumber}</strong></p>
    <p>Shipping mark: <strong>${customer.shippingMark}</strong></p>
    <table style="width:100%;border-collapse:collapse">
      ${rows}
      <tr><td>Subtotal</td><td style="text-align:right">${formatCedis(
        order.subtotal
      )}</td></tr>
      <tr><td>Delivery (${order.shipRegion ?? ''})</td>
          <td style="text-align:right">${formatCedis(
            order.deliveryFee
          )}</td></tr>
      <tr><td><strong>Total</strong></td>
          <td style="text-align:right"><strong>${formatCedis(
            order.total
          )}</strong></td></tr>
    </table>
    <p>Deliver to: ${order.shipName}, ${order.shipAddress}, ${order.shipCity}, ${order.shipRegion}</p>
  `;

  // Resend doesn't throw on send failures by default; it resolves with
  // `{ data: null, error: ResendError }`. We have to inspect the result
  // explicitly or failures slip past silently.
  const result = await resend.emails.send({
    from: FROM,
    to: [customer.email],
    subject: `Order ${order.orderNumber} confirmed`,
    html,
  });

  if (result.error) {
    console.error(
      `sendOrderConfirmationEmail: Resend rejected order ${order.orderNumber} ` +
        `(to ${customer.email}): ${result.error.name} — ${result.error.message}`
    );
    return;
  }

  console.log(
    `sendOrderConfirmationEmail: sent ${order.orderNumber} to ${customer.email} (id ${result.data?.id})`
  );
}
