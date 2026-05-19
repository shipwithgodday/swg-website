import { cache } from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';

/** The current Clerk user's customer row, or null if none yet. */
export async function getCustomerByClerkId(clerkUserId: string) {
  const [c] = await db
    .select()
    .from(customers)
    .where(eq(customers.clerkUserId, clerkUserId));
  return c ?? null;
}

/** All orders for a customer, newest first. */
export async function getOrdersForCustomer(customerId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));
}

/** A single order with its items, by order number. */
export const getOrderByNumber = cache(async (orderNumber: string) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber));
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  return { order, items };
});
