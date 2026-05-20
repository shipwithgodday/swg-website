import { cache } from 'react';
import { asc, desc, eq, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';

/**
 * Customers for the admin list with the aggregates the table needs to
 * sort on: order count, lifetime spend (paid+ only), and the most recent
 * order timestamp. Ordered by shipping mark (smallest/oldest first) so
 * the page has a sensible default before the client applies a sort.
 */
export async function listCustomers() {
  const rows = await db
    .select({
      id: customers.id,
      shippingMark: customers.shippingMark,
      shippingMarkNo: customers.shippingMarkNo,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      orderCount: count(orders.id),
      // Pending/cancelled orders don't count as real revenue.
      lifetimeSpend: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','processing','shipped','delivered') then ${orders.total} else 0 end), 0)`,
      lastOrderAt: sql<Date | null>`max(${orders.createdAt})`,
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(customers.id)
    .orderBy(asc(customers.shippingMarkNo));
  // Postgres returns SUM/MAX as strings over the wire; coerce so the
  // table can sort numerically.
  return rows.map((r) => ({
    ...r,
    lifetimeSpend: Number(r.lifetimeSpend ?? 0),
    lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt) : null,
  }));
}

/** A customer with their orders, by id. */
export const getAdminCustomer = cache(async (id: string) => {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  if (!customer) return null;
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt));
  return { customer, orders: customerOrders };
});

/** All customers except `excludeId` — merge-target candidates. */
export async function listMergeCandidates(excludeId: string) {
  const rows = await db
    .select({
      id: customers.id,
      shippingMark: customers.shippingMark,
      name: customers.name,
      clerkUserId: customers.clerkUserId,
    })
    .from(customers)
    .orderBy(desc(customers.createdAt));
  return rows.filter((r) => r.id !== excludeId);
}
