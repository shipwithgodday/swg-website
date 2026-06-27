'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { resolveCustomerId } from '@/lib/shop/customer';
import { sendAdminSignupEmail } from '@/lib/email/admin-signup-email';

const schema = z.object({
  fullName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  company: z.string().trim().optional(),
});

export interface CompleteSignupInput {
  fullName: string;
  phone: string;
  company?: string;
}

/**
 * Called from the /sign-up form once Clerk verification completes and the
 * session is active. Creates/links the customer row, assigns a shipping mark,
 * and emails the admin when a brand-new mark is generated. Idempotent: a second
 * call short-circuits on the existing clerkUserId link.
 */
export async function completeSignup(
  input: CompleteSignupInput
): Promise<{ shippingMark: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Not authenticated');

  const { fullName, phone, company } = schema.parse(input);

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const result = await resolveCustomerId({
    clerkUserId: userId,
    email,
    phone,
    name: fullName,
    company: company ?? null,
    source: 'signup',
  });

  if (result.created) {
    await sendAdminSignupEmail({
      fullName,
      email: email ?? '',
      phone,
      company: company ?? null,
      shippingMark: result.shippingMark,
      createdAt: new Date(),
    });
  }

  return { shippingMark: result.shippingMark };
}
