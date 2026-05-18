import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';

/** Reduces a raw phone string to its last 9 digits for fuzzy matching. */
export function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length > 9 ? digits.slice(-9) : digits;
}

export interface ResolveCustomerInput {
  clerkUserId: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

/**
 * Resolves the customer for an order:
 * 1. existing row by clerkUserId, else
 * 2. an imported row matched by email then phone (claimed by setting
 *    clerk_user_id), else
 * 3. a brand-new customer with the next shipping mark from the sequence.
 * Returns the customer id.
 */
export async function resolveCustomerId(
  input: ResolveCustomerInput
): Promise<string> {
  // 1. Already linked.
  const linked = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.clerkUserId, input.clerkUserId))
    .limit(1);
  if (linked[0]) return linked[0].id;

  // 2. Match an imported/offline customer with no Clerk link yet.
  const candidates = await db
    .select()
    .from(customers)
    .where(sql`${customers.clerkUserId} is null`);

  let match = input.email
    ? candidates.find(
        (c) =>
          c.email != null &&
          c.email.toLowerCase() === input.email!.toLowerCase()
      )
    : undefined;

  if (!match && input.phone) {
    const target = normalizePhone(input.phone);
    if (target) {
      match = candidates.find(
        (c) => normalizePhone(c.phone) === target
      );
    }
  }

  if (match) {
    await db
      .update(customers)
      .set({
        clerkUserId: input.clerkUserId,
        email: match.email ?? input.email,
        phone: match.phone ?? input.phone,
        name: match.name ?? input.name,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, match.id));
    return match.id;
  }

  // 3. New customer — allocate the next shipping mark.
  const seq = await db.execute(
    sql`SELECT nextval('shipping_mark_seq') AS n`
  );
  const markNo = Number((seq.rows[0] as { n: string | number }).n);
  const [created] = await db
    .insert(customers)
    .values({
      clerkUserId: input.clerkUserId,
      shippingMark: `GD${markNo}`,
      shippingMarkNo: markNo,
      email: input.email,
      phone: input.phone,
      name: input.name,
      source: 'system',
    })
    .returning({ id: customers.id });
  return created.id;
}
