import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { formatCedis } from '@/lib/shop/money';
import { formatOrderStatus } from '@/lib/shop/status-format';
import resend from '@/lib/emails';

const FROM = 'Ship With Godday <info@shipwithgodday.com>';

interface StatusCopy {
  subject: (orderNumber: string) => string;
  headline: string;
  intro: string;
}

/**
 * Customer-facing copy per status. `pending` is intentionally omitted —
 * we don't email the customer when the order is first created; that's
 * the "paid" email after Paystack confirms.
 */
const STATUS_COPY: Record<string, StatusCopy> = {
  paid: {
    subject: (n) => `Order ${n} confirmed`,
    headline: 'Thank you for your order',
    intro:
      "We've received your payment and we're getting started on your order. We'll email you again as it moves along.",
  },
  processing: {
    subject: (n) => `Order ${n} is being prepared`,
    headline: "We're preparing your order",
    intro:
      "Your order is being packed for shipment. We'll email you when it leaves the warehouse.",
  },
  shipped: {
    subject: (n) => `Order ${n} is on the way`,
    headline: 'Your order has shipped',
    intro:
      "Your order has left the warehouse and is on the way to you. We'll let you know once it has been delivered.",
  },
  delivered: {
    subject: (n) => `Order ${n} delivered`,
    headline: 'Your order has been delivered',
    intro:
      'Thanks for shopping with Ship With Godday. If anything is amiss, just reply to this email and we will sort it out.',
  },
  cancelled: {
    subject: (n) => `Order ${n} cancelled`,
    headline: 'Your order has been cancelled',
    intro:
      'Your order has been cancelled. If you were charged, a refund is on the way. Reply to this email if you have any questions.',
  },
};

/**
 * Sends the customer-facing email for a given order status. Best-effort:
 * every failure mode is logged so we can see what happened next time, but
 * nothing throws — callers (webhook, callback page, admin status update)
 * must never be blocked by an email problem.
 */
export async function sendOrderStatusEmail(
  orderId: string,
  status: string
): Promise<void> {
  const copy = STATUS_COPY[status];
  if (!copy) {
    // Statuses without customer-facing email (e.g. 'pending'). Silently skip.
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error(
      `sendOrderStatusEmail: RESEND_API_KEY not set; skipping ${status} for ${orderId}`
    );
    return;
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) {
    console.error(
      `sendOrderStatusEmail: order ${orderId} not found`
    );
    return;
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId));
  if (!customer?.email) {
    console.warn(
      `sendOrderStatusEmail: no email on customer for ${order.orderNumber}; skipping ${status}`
    );
    return;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const itemRows = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0">${i.productName} (${i.variantName}) × ${i.quantity}</td>` +
        `<td style="text-align:right;padding:4px 0">${formatCedis(
          i.unitPrice * i.quantity
        )}</td></tr>`
    )
    .join('');

  const html = `
    <h2 style="margin:0 0 8px">${copy.headline}</h2>
    <p style="color:#555;margin:0 0 16px">${copy.intro}</p>
    <p style="margin:0 0 4px"><strong>Order:</strong> ${order.orderNumber}</p>
    <p style="margin:0 0 4px"><strong>Status:</strong> ${formatOrderStatus(
      status
    )}</p>
    <p style="margin:0 0 16px"><strong>Shipping mark:</strong> ${customer.shippingMark}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${itemRows}
      <tr><td style="padding-top:8px;border-top:1px solid #eee">Subtotal</td>
          <td style="text-align:right;padding-top:8px;border-top:1px solid #eee">${formatCedis(
            order.subtotal
          )}</td></tr>
      <tr><td>Delivery${order.shipRegion ? ` (${order.shipRegion})` : ''}</td>
          <td style="text-align:right">${formatCedis(
            order.deliveryFee
          )}</td></tr>
      <tr><td style="padding-top:8px;border-top:1px solid #eee"><strong>Total</strong></td>
          <td style="text-align:right;padding-top:8px;border-top:1px solid #eee"><strong>${formatCedis(
            order.total
          )}</strong></td></tr>
    </table>
    <p style="margin:16px 0 4px"><strong>Deliver to</strong></p>
    <p style="color:#555;margin:0">${order.shipName}<br>${order.shipAddress}<br>${order.shipCity}, ${order.shipRegion}<br>${order.shipPhone}</p>
  `;

  // Resend doesn't throw on send failures; it resolves with
  // `{ data: null, error: ResendError }`. Inspect the response.
  const result = await resend.emails.send({
    from: FROM,
    to: [customer.email],
    subject: copy.subject(order.orderNumber),
    html,
  });

  if (result.error) {
    console.error(
      `sendOrderStatusEmail: Resend rejected ${status} for order ${order.orderNumber} ` +
        `(to ${customer.email}): ${result.error.name} — ${result.error.message}`
    );
    return;
  }

  console.log(
    `sendOrderStatusEmail: sent ${status} for ${order.orderNumber} to ${customer.email} (id ${result.data?.id})`
  );
}

/**
 * Back-compat alias for callers that still expect the old name. The
 * 'paid' status is the original order-confirmation email.
 */
export function sendOrderConfirmationEmail(orderId: string) {
  return sendOrderStatusEmail(orderId, 'paid');
}
