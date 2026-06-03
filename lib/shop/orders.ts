import { cache } from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import {
  claimCustomerByClerkId,
  type ViewerClerkUser,
} from '@/lib/shop/customer';

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

export interface CheckoutPrefill {
  name: string;
  phone: string;
  address: string;
  city: string;
}

/**
 * Delivery details to pre-fill the checkout form for a returning, signed-in
 * customer — sourced from their most recent order, falling back to their
 * stored customer name/phone. Returns null when there's nothing to pre-fill.
 */
export async function getCheckoutPrefill(
  clerkUserId: string,
  user: ViewerClerkUser
): Promise<CheckoutPrefill | null> {
  const customer = await claimCustomerByClerkId(clerkUserId, user);
  if (!customer) return null;
  const [recent] = await getOrdersForCustomer(customer.id);
  const prefill: CheckoutPrefill = {
    name: recent?.shipName ?? customer.name ?? '',
    phone: recent?.shipPhone ?? customer.phone ?? '',
    address: recent?.shipAddress ?? '',
    city: recent?.shipCity ?? '',
  };
  // Nothing useful to pre-fill → let the form stay empty.
  if (!prefill.name && !prefill.phone && !prefill.address && !prefill.city) {
    return null;
  }
  return prefill;
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
