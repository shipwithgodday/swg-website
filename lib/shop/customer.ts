import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { allocateShippingMark } from './shipping-mark-allocation';

/** Reduces a raw phone string to its last 9 digits for fuzzy matching. */
export function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length > 9 ? digits.slice(-9) : digits;
}

export interface ViewerClerkUser {
  emailAddresses: { emailAddress: string }[];
  phoneNumbers?: { phoneNumber: string }[];
}

/**
 * Returns the customer row that belongs to a Clerk user, claiming an
 * unlinked guest/imported row by email or phone if one matches. Unlike
 * `resolveCustomerId`, this never creates a new customer — it's safe to call
 * on every page-view of /shop/orders or /account.
 *
 * The claim step is what lets a guest who later signs up with the same
 * email inherit their existing orders and shipping mark.
 */
export async function claimCustomerByClerkId(
  clerkUserId: string,
  user: ViewerClerkUser
) {
  // 1. Already linked.
  const [linked] = await db
    .select()
    .from(customers)
    .where(eq(customers.clerkUserId, clerkUserId))
    .limit(1);
  if (linked) return linked;

  // 2. Try to claim an unlinked row by email or phone.
  const emails = user.emailAddresses
    .map((e) => e.emailAddress.trim().toLowerCase())
    .filter(Boolean);
  const phones = (user.phoneNumbers ?? [])
    .map((p) => normalizePhone(p.phoneNumber))
    .filter(Boolean);

  const candidates = await db
    .select()
    .from(customers)
    .where(sql`${customers.clerkUserId} is null`);

  let match = emails.length
    ? candidates.find(
        (c) => c.email && emails.includes(c.email.toLowerCase())
      )
    : undefined;
  if (!match && phones.length) {
    match = candidates.find((c) =>
      phones.includes(normalizePhone(c.phone))
    );
  }
  if (!match) return null;

  await db
    .update(customers)
    .set({ clerkUserId, updatedAt: new Date() })
    .where(eq(customers.id, match.id));
  return { ...match, clerkUserId };
}

export interface ResolveGuestInput {
  email: string;
  phone: string | null;
  name: string | null;
}

/**
 * Resolves (or creates) the customer for a guest checkout — i.e. an order
 * placed without a Clerk session. Mirrors `resolveCustomerId`'s match logic
 * by email first, then phone, but skips the Clerk-link step.
 *
 * If a future visitor signs in with the same email, `resolveCustomerId`'s
 * `clerkUserId is null` candidate scan will link them to the customer row
 * created here, so order history follows them across accounts.
 */
export async function resolveGuestCustomer(
  input: ResolveGuestInput
): Promise<string> {
  const result = await resolveContactCustomer({ ...input, source: 'guest' });
  return result.customerId;
}

export interface ResolveContactInput extends ResolveGuestInput {
  source: string;
}

/**
 * Resolves (or creates) the customer for someone identified only by contact
 * details — a guest checkout or a mailing-list signup. Matches by email
 * first, then phone; otherwise creates a customer with the next shipping
 * mark. On a match, fills in any contact fields the row is missing.
 *
 * `created` is true only when a fresh GD{n} mark was allocated.
 */
export async function resolveContactCustomer(
  input: ResolveContactInput
): Promise<ResolveCustomerResult> {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Match by email (case-insensitive). A pre-existing Clerk-linked row with
  // the same email is fine to reuse — it's the same person.
  const byEmail = await db
    .select()
    .from(customers)
    .where(sql`lower(${customers.email}) = ${normalizedEmail}`)
    .limit(1);
  let match: (typeof byEmail)[number] | undefined = byEmail[0];

  // Match by phone, normalized to the last 9 digits.
  if (!match && input.phone) {
    const target = normalizePhone(input.phone);
    if (target) {
      const candidates = await db.select().from(customers);
      match = candidates.find((c) => normalizePhone(c.phone) === target);
    }
  }

  if (match) {
    if (!match.email || !match.phone || !match.name) {
      await db
        .update(customers)
        .set({
          email: match.email ?? input.email,
          phone: match.phone ?? input.phone,
          name: match.name ?? input.name,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, match.id));
    }
    return {
      customerId: match.id,
      shippingMark: match.shippingMark,
      created: false,
    };
  }

  // Brand-new contact — allocate the next shipping mark.
  const { markNo, shippingMark } = await allocateShippingMark();
  const [created] = await db
    .insert(customers)
    .values({
      shippingMark,
      shippingMarkNo: markNo,
      email: input.email,
      phone: input.phone,
      name: input.name,
      source: input.source,
    })
    .returning({ id: customers.id });
  return { customerId: created.id, shippingMark, created: true };
}

export interface ResolveCustomerInput {
  clerkUserId: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  company?: string | null;
  source?: string;
}

export interface ResolveCustomerResult {
  customerId: string;
  shippingMark: string;
  created: boolean;
}

/**
 * Resolves the customer for an order or sign-up:
 * 1. existing row by clerkUserId, else
 * 2. an unlinked row matched by email then phone (claimed by setting
 *    clerk_user_id), else
 * 3. a brand-new customer with the next shipping mark from the sequence.
 *
 * `created` is true only in case 3 (a fresh GD{n} mark was allocated).
 */
export async function resolveCustomerId(
  input: ResolveCustomerInput
): Promise<ResolveCustomerResult> {
  // 1. Already linked.
  const linked = await db
    .select({ id: customers.id, shippingMark: customers.shippingMark })
    .from(customers)
    .where(eq(customers.clerkUserId, input.clerkUserId))
    .limit(1);
  if (linked[0]) {
    return {
      customerId: linked[0].id,
      shippingMark: linked[0].shippingMark,
      created: false,
    };
  }

  // 2. Match an unlinked imported/guest customer.
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
        company: match.company ?? input.company ?? null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, match.id));
    return {
      customerId: match.id,
      shippingMark: match.shippingMark,
      created: false,
    };
  }

  // 3. New customer — allocate the next shipping mark.
  const { markNo, shippingMark } = await allocateShippingMark();
  const [created] = await db
    .insert(customers)
    .values({
      clerkUserId: input.clerkUserId,
      shippingMark,
      shippingMarkNo: markNo,
      email: input.email,
      phone: input.phone,
      name: input.name,
      company: input.company ?? null,
      source: input.source ?? 'system',
    })
    .returning({ id: customers.id });
  return { customerId: created.id, shippingMark, created: true };
}
