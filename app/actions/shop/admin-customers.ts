'use server';
import { revalidatePath } from 'next/cache';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import {
  getAdminCustomer,
  listMergeCandidates,
} from '@/lib/shop/admin-customers';
import {
  customerCreateSchema,
  customerEditSchema,
} from '@/lib/shop/validation';
import type { ActionResult } from './categories';

export interface CustomerDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  shippingMark: string;
  accountLinked: boolean;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }[];
  mergeCandidates: {
    id: string;
    shippingMark: string;
    name: string | null;
  }[];
}

/** Full detail for one customer: contact info, orders, merge candidates. */
export async function getCustomerDetail(
  id: string
): Promise<CustomerDetail | null> {
  await requireAdmin();
  const data = await getAdminCustomer(id);
  if (!data) return null;
  const candidates = await listMergeCandidates(id);
  return {
    id: data.customer.id,
    name: data.customer.name,
    email: data.customer.email,
    phone: data.customer.phone,
    shippingMark: data.customer.shippingMark,
    accountLinked: data.customer.clerkUserId != null,
    orders: data.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
    })),
    mergeCandidates: candidates.map((c) => ({
      id: c.id,
      shippingMark: c.shippingMark,
      name: c.name,
    })),
  };
}

/**
 * Peek at the next shipping mark a new customer would receive, without
 * advancing the sequence. Used by the New Customer dialog to show admins
 * what they're about to assign. Concurrent admin creates may shift the
 * actual value by one or two — the server still enforces uniqueness.
 */
export async function getNextShippingMark(): Promise<string> {
  await requireAdmin();
  const [row] = await db
    .select({
      max: sql<number>`coalesce(max(${customers.shippingMarkNo}), 0)`,
    })
    .from(customers);
  const next = Number(row?.max ?? 0) + 1;
  return `GD${next}`;
}

/** Creates a customer manually from the admin, allocating a shipping mark. */
export async function createCustomer(
  raw: unknown
): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const parsed = customerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, email, phone, shippingMark } = parsed.data;

  // Always advance the sequence so `shippingMarkNo` (used for sorting) stays
  // monotonic, even when the visible mark is a custom string.
  const seq = await db.execute(
    sql`SELECT nextval('shipping_mark_seq') AS n`
  );
  const markNo = Number((seq.rows[0] as { n: string | number }).n);

  try {
    const [created] = await db
      .insert(customers)
      .values({
        shippingMark: shippingMark ?? `GD${markNo}`,
        shippingMarkNo: markNo,
        name,
        email: email ?? null,
        phone: phone ?? null,
        source: 'admin',
      })
      .returning({ id: customers.id });

    revalidatePath('/admin/customers');
    return { ok: true, id: created.id };
  } catch (err) {
    // 23505 = unique violation; shipping_mark is unique.
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === '23505'
    ) {
      return { ok: false, error: 'That shipping mark is already in use' };
    }
    throw err;
  }
}

export async function updateCustomer(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = customerEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, email, phone } = parsed.data;
  await db
    .update(customers)
    .set({
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id));
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath('/admin/customers');
  return { ok: true };
}

/**
 * Merges `mergedId` into `survivorId`: re-points the merged customer's
 * orders to the survivor, then deletes the merged customer. The survivor
 * keeps its shipping mark. Blocked if both records are account-linked.
 */
export async function mergeCustomers(
  survivorId: string,
  mergedId: string
): Promise<ActionResult> {
  await requireAdmin();
  if (survivorId === mergedId) {
    return { ok: false, error: 'Pick two different customers.' };
  }

  const [survivor] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, survivorId));
  const [merged] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, mergedId));
  if (!survivor || !merged) {
    return { ok: false, error: 'Customer not found.' };
  }
  if (survivor.clerkUserId && merged.clerkUserId) {
    return {
      ok: false,
      error:
        'Both customers have linked accounts and cannot be merged.',
    };
  }

  await db.batch([
    db
      .update(orders)
      .set({ customerId: survivorId })
      .where(eq(orders.customerId, mergedId)),
    db.delete(customers).where(eq(customers.id, mergedId)),
  ]);

  revalidatePath('/admin/customers');
  revalidatePath(`/admin/customers/${survivorId}`);
  return { ok: true };
}

export type DeleteCustomerResult =
  | { ok: true; mode: 'deleted' }
  | { ok: true; mode: 'anonymized'; orderCount: number }
  | { ok: false; error: string };

/**
 * Removes a customer. The behaviour depends on whether they have orders:
 *
 * - **No orders:** the row is hard-deleted and, if it held the
 *   highest `shippingMarkNo`, the `shipping_mark_seq` is rewound so
 *   the next new customer reuses that mark (no permanent gap at the
 *   top).
 *
 * - **Has orders:** the row is *anonymized* — name, email, phone and
 *   clerkUserId are cleared and `source` is set to `'deleted'`. The
 *   shipping mark and the orders stay attached for revenue history,
 *   but no PII is left. This is the standard right answer when a
 *   customer asks to be forgotten without taking down financial
 *   records, and it's also what 'delete' should do for any customer
 *   you simply don't want to see in the active list any more.
 *
 * Either way the email-by-email and phone-by-phone match logic stops
 * resolving to this row (the columns are null), so a returning user
 * with the same email/phone will get a fresh record + shipping mark.
 */
export async function deleteCustomer(
  id: string
): Promise<DeleteCustomerResult> {
  await requireAdmin();

  const [c] = await db
    .select({
      id: customers.id,
      shippingMarkNo: customers.shippingMarkNo,
    })
    .from(customers)
    .where(eq(customers.id, id));
  if (!c) return { ok: false, error: 'Customer not found.' };

  const [oc] = await db
    .select({ n: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.customerId, id));
  const orderCount = Number(oc?.n ?? 0);

  if (orderCount > 0) {
    // Anonymize — keep the row + shipping mark + orders, strip PII.
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
    revalidatePath('/admin/customers');
    return { ok: true, mode: 'anonymized', orderCount };
  }

  await db.delete(customers).where(eq(customers.id, id));

  // Rewind the shipping-mark sequence to the new max so that if we just
  // deleted the most-recently-allocated mark, the next new customer
  // picks it up again instead of skipping past it. setval(seq, n, true)
  // sets last_value=n with is_called=true, so the next nextval()
  // returns n + 1. Skip entirely if no customers remain (sequences with
  // MINVALUE=1 reject setval(0)).
  const [maxRow] = await db
    .select({ m: sql<number | null>`max(${customers.shippingMarkNo})` })
    .from(customers);
  const newMax = Number(maxRow?.m ?? 0);
  if (newMax > 0) {
    await db.execute(
      sql`SELECT setval('shipping_mark_seq', ${newMax}, true)`
    );
  }

  revalidatePath('/admin/customers');
  return { ok: true, mode: 'deleted' };
}
