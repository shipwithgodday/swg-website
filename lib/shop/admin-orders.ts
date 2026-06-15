import { cache } from 'react';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';

export interface AdminOrderFilter {
  status?: string;
  search?: string;
}

/** Orders for the admin list, with customer name + shipping mark. */
export async function listOrders(filter: AdminOrderFilter = {}) {
  const conditions = [];
  if (filter.status) {
    conditions.push(eq(orders.status, filter.status));
  }
  if (filter.search) {
    const term = `%${filter.search}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, term),
        ilike(customers.name, term),
        ilike(customers.shippingMark, term)
      )
    );
  }
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      customerName: customers.name,
      shippingMark: customers.shippingMark,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt));
}

/** A single order with its items and customer, by order id. */
export const getAdminOrder = cache(async (id: string) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id));
  if (!order) return null;
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId));
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));
  return { order, customer: customer ?? null, items };
});
