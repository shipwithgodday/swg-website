import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders, subscribers } from '@/lib/db/schema';
import { normalizeEmail } from './normalize-email';

/**
 * Shared deletion logic for the synced customer / bulk-email-recipient
 * removal. Lives outside the `'use server'` action files so it can export
 * plain (non-action) helpers; the action wrappers add `requireAdmin()` and
 * `revalidatePath()`.
 *
 * The bulk-email audience is the union (by email) of `subscribers` and
 * `customers`. To remove someone "everywhere" we must purge BOTH tables —
 * otherwise a deleted customer who also signed up for the newsletter would
 * reappear in the email list, and vice versa.
 */

export type CustomerDeleteMode = 'deleted' | 'anonymized';

/**
 * Removes a single customer row. Hard-deletes when they have no orders
 * (and rewinds `shipping_mark_seq` if they held the top mark, so the next
 * new customer reuses it). Anonymizes — strips PII, keeps the row + shipping
 * mark + orders — when they have orders, so revenue history survives.
 */
export async function deleteOrAnonymizeCustomer(
  id: string
): Promise<CustomerDeleteMode> {
  const [oc] = await db
    .select({ n: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.customerId, id));
  const orderCount = Number(oc?.n ?? 0);

  if (orderCount > 0) {
    await db
      .update(customers)
      .set({
        name: null,
        email: null,
        phone: null,
        clerkUserId: null,
        source: 'deleted',
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));
    return 'anonymized';
  }

  await db.delete(customers).where(eq(customers.id, id));

  // Rewind the shipping-mark sequence to the new max so a deleted top mark
  // is reused rather than skipped. setval(seq, n, true) makes the next
  // nextval() return n + 1. Skip when no customers remain (MINVALUE=1
  // sequences reject setval(0)).
  const [maxRow] = await db
    .select({ m: sql<number | null>`max(${customers.shippingMarkNo})` })
    .from(customers);
  const newMax = Number(maxRow?.m ?? 0);
  if (newMax > 0) {
    await db.execute(sql`SELECT setval('shipping_mark_seq', ${newMax}, true)`);
  }

  return 'deleted';
}

/**
 * Deletes every `subscribers` row whose email matches (case-insensitively).
 * Returns the number removed. The `subscribers.email` column is unique, so
 * this is at most one row, but we match defensively on the normalized form.
 */
export async function purgeSubscribersByEmail(
  email: string | null | undefined
): Promise<number> {
  const key = normalizeEmail(email);
  if (!key) return 0;
  const removed = await db
    .delete(subscribers)
    .where(eq(sql`lower(${subscribers.email})`, key))
    .returning({ id: subscribers.id });
  return removed.length;
}

export interface AudiencePurgeResult {
  subscribersRemoved: number;
  customersDeleted: number;
  customersAnonymized: number;
}

/**
 * Removes an email from the bulk-email audience entirely: deletes any
 * newsletter subscription with that email and deletes/anonymizes every
 * shop customer carrying it. Idempotent and safe when the email exists in
 * only one (or neither) table.
 */
export async function purgeEmailFromAudience(
  email: string
): Promise<AudiencePurgeResult> {
  const key = normalizeEmail(email);
  if (!key) {
    return {
      subscribersRemoved: 0,
      customersDeleted: 0,
      customersAnonymized: 0,
    };
  }

  const subscribersRemoved = await purgeSubscribersByEmail(key);

  const matches = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(sql`lower(${customers.email})`, key));

  let customersDeleted = 0;
  let customersAnonymized = 0;
  for (const c of matches) {
    const mode = await deleteOrAnonymizeCustomer(c.id);
    if (mode === 'deleted') customersDeleted += 1;
    else customersAnonymized += 1;
  }

  return { subscribersRemoved, customersDeleted, customersAnonymized };
}
