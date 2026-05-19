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

/** Creates a customer manually from the admin, allocating a shipping mark. */
export async function createCustomer(
  raw: unknown
): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const parsed = customerCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, email, phone } = parsed.data;

  const seq = await db.execute(
    sql`SELECT nextval('shipping_mark_seq') AS n`
  );
  const markNo = Number((seq.rows[0] as { n: string | number }).n);

  const [created] = await db
    .insert(customers)
    .values({
      shippingMark: `GD${markNo}`,
      shippingMarkNo: markNo,
      name,
      email: email ?? null,
      phone: phone ?? null,
      source: 'admin',
    })
    .returning({ id: customers.id });

  revalidatePath('/admin/customers');
  return { ok: true, id: created.id };
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
