'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/shop/auth';
import {
  purgeEmailFromAudience,
  type AudiencePurgeResult,
} from '@/lib/shop/audience-delete';

export type DeleteRecipientResult =
  | { ok: true; summary: AudiencePurgeResult }
  | { ok: false; error: string };

/**
 * Removes an email from the bulk-email audience entirely — deletes any
 * newsletter subscription and deletes/anonymizes any shop customer with
 * that email. Keeps the Customers list and the bulk-email list in sync.
 */
export async function deleteRecipient(
  email: string
): Promise<DeleteRecipientResult> {
  await requireAdmin();
  if (!email?.trim()) {
    return { ok: false, error: 'No email provided.' };
  }
  const summary = await purgeEmailFromAudience(email);
  revalidatePath('/swg-admin/customers');
  return { ok: true, summary };
}
