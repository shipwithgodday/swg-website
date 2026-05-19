import { and, desc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  customers,
  products,
  productVariants,
} from '@/lib/db/schema';
import {
  rangeDays,
  rangeToSince,
  type DashboardRange,
} from '@/lib/shop/date-range';

// Statuses that count as real revenue.
const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

const LOW_STOCK_THRESHOLD = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Percentage change from `prev` to `curr`. */
function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/** Revenue + order count for orders created in [start, end). */
async function salesBetween(start: Date, end?: Date) {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, start),
        ...(end ? [lt(orders.createdAt, end)] : [])
      )
    );
  return {
    revenue: Number(row?.revenue ?? 0),
    count: Number(row?.count ?? 0),
  };
}

/** Range-aware KPIs with deltas vs. the preceding equal-length period. */
export async function getDashboardMetrics(range: DashboardRange) {
  const now = new Date();
  const since = rangeToSince(range, now);
  const prevSince = new Date(since.getTime() - rangeDays(range) * DAY_MS);

  const [
    current,
    previous,
    attention,
    customerCount,
    recentOrders,
    lowStock,
  ] = await Promise.all([
    salesBetween(since),
    salesBetween(prevSince, since),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.status, ['paid', 'processing'])),
    db.select({ count: sql<number>`count(*)` }).from(customers),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8),
    db
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
      .limit(8),
  ]);

  const aov =
    current.count > 0 ? Math.round(current.revenue / current.count) : 0;
  const prevAov =
    previous.count > 0
      ? Math.round(previous.revenue / previous.count)
      : 0;

  return {
    revenue: {
      value: current.revenue,
      delta: pctChange(current.revenue, previous.revenue),
    },
    orders: {
      value: current.count,
      delta: pctChange(current.count, previous.count),
    },
    aov: { value: aov, delta: pctChange(aov, prevAov) },
    ordersNeedingAttention: Number(attention[0]?.count ?? 0),
    customerCount: Number(customerCount[0]?.count ?? 0),
    recentOrders,
    lowStock,
  };
}

/** Daily revenue buckets across the range, zero-filled for empty days. */
export async function getRevenueSeries(range: DashboardRange) {
  const now = new Date();
  const since = rangeToSince(range, now);

  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, since)
      )
    )
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`);

  const byDay = new Map(rows.map((r) => [r.day, Number(r.revenue)]));
  const series: { date: string; revenue: number }[] = [];
  for (let i = rangeDays(range) - 1; i >= 0; i--) {
    const key = new Date(now.getTime() - i * DAY_MS)
      .toISOString()
      .slice(0, 10);
    series.push({ date: key, revenue: byDay.get(key) ?? 0 });
  }
  return series;
}

/** Best-selling products (by revenue) within the range. */
export async function getTopProducts(range: DashboardRange, limit = 5) {
  const since = rangeToSince(range);
  const rows = await db
    .select({
      name: orderItems.productName,
      units: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(${orderItems.unitPrice} * ${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, since)
      )
    )
    .groupBy(orderItems.productName)
    .orderBy(
      desc(sql`sum(${orderItems.unitPrice} * ${orderItems.quantity})`)
    )
    .limit(limit);

  return rows.map((r) => ({
    name: r.name,
    units: Number(r.units),
    revenue: Number(r.revenue),
  }));
}
