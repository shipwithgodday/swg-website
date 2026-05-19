import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  orders,
  customers,
  products,
  productVariants,
} from '@/lib/db/schema';

// Statuses that count as real revenue.
const REVENUE_STATUSES = [
  'paid',
  'processing',
  'shipped',
  'delivered',
];

const LOW_STOCK_THRESHOLD = 5;

/** Revenue + order count since `since`. */
async function salesSince(since: Date) {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, since)
      )
    );
  return {
    revenue: Number(row?.revenue ?? 0),
    count: Number(row?.count ?? 0),
  };
}

export async function getDashboardMetrics() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [today, week, month] = await Promise.all([
    salesSince(dayAgo),
    salesSince(weekAgo),
    salesSince(monthAgo),
  ]);

  // Orders awaiting fulfilment: paid or processing.
  const [attention] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(inArray(orders.status, ['paid', 'processing']));

  const [customerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers);

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  const lowStock = await db
    .select({
      id: productVariants.id,
      variantName: productVariants.name,
      stock: productVariants.stockQuantity,
      productName: products.name,
      productId: products.id,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD))
    .orderBy(productVariants.stockQuantity)
    .limit(10);

  return {
    today,
    week,
    month,
    ordersNeedingAttention: Number(attention?.count ?? 0),
    customerCount: Number(customerCount?.count ?? 0),
    recentOrders,
    lowStock,
  };
}
