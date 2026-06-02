import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';

export interface PublicOrderItem {
  productName: string;
  variantName: string;
  quantity: number;
  isPreorder: boolean;
  preorderShipEstimate: string | null;
}

export interface PublicOrder {
  orderNumber: string;
  status: string;
  createdAt: string; // ISO 8601
  shippingMark: string;
  items: PublicOrderItem[];
}

/**
 * Pure mapper from raw order/item rows to the public-safe payload. Picks an
 * explicit allow-list of fields so that personal delivery info (name, address,
 * phone) and pricing can never leak through this path, even if the caller
 * passes full rows.
 */
export function shapePublicOrder(
  order: { orderNumber: string; status: string; createdAt: Date },
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    isPreorder: boolean;
    preorderShipEstimate: string | null;
  }>,
  shippingMark: string
): PublicOrder {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    shippingMark,
    items: items.map((i) => ({
      productName: i.productName,
      variantName: i.variantName,
      quantity: i.quantity,
      isPreorder: i.isPreorder,
      preorderShipEstimate: i.preorderShipEstimate,
    })),
  };
}

/**
 * Public, no-auth lookup of an order's status by its order number. Returns the
 * privacy-limited shape (no delivery details). Returns null when not found.
 * Distinct from `getOrderByNumber`, which is ownership-checked and used by the
 * logged-in order detail page.
 */
export async function getPublicOrderStatusByNumber(
  orderNumber: string
): Promise<PublicOrder | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber));
  if (!order) return null;

  const [customer] = await db
    .select({ shippingMark: customers.shippingMark })
    .from(customers)
    .where(eq(customers.id, order.customerId));

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return shapePublicOrder(order, items, customer?.shippingMark ?? '');
}
