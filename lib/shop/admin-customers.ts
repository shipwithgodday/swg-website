import { cache } from 'react';
import { asc, desc, eq, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';

/**
 * Customers for the admin list, with order counts, ordered by shipping
 * mark (smallest/oldest first).
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
      orderCount: count(orders.id),
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(customers.id)
    .orderBy(asc(customers.shippingMarkNo));
  return rows;
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
