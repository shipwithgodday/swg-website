import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { formatCedis } from '@/lib/shop/money';
import resend from '@/lib/emails';

/** Builds and sends the order confirmation email. Best-effort. */
export async function sendOrderConfirmationEmail(
  orderId: string
): Promise<void> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId));
  if (!customer?.email) return;

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

  await resend.emails.send({
    from: 'Ship With Godday <info@shipwithgodday.com>',
    to: [customer.email],
    subject: `Order ${order.orderNumber} confirmed`,
    html,
  });
}
