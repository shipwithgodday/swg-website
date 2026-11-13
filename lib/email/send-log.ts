import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { emailSends, emailSendRecipients } from '@/lib/db/schema';
import type { BulkSendSummary } from './bulk-send';

const INSERT_CHUNK = 200;

// Logging must never stop or fail a send: every helper here swallows and
// reports its own errors.

/** Records the attempt before anything is sent. Returns its id, or null. */
export async function startSendLog(input: {
  subject: string;
  content: string;
  requestedBy: string | null;
  retryOfId: string | null;
  recipientCount: number;
}): Promise<string | null> {
  try {
    const [row] = await db
      .insert(emailSends)
      .values({ ...input, status: 'sending' })
      .returning({ id: emailSends.id });
    return row.id;
  } catch (err) {
    console.error('Send-log start failed:', err);
    return null;
  }
}

/** Stores every recipient's outcome and the attempt's final status. */
export async function finishSendLog(
  sendId: string | null,
  { sent, failed }: BulkSendSummary
): Promise<void> {
  if (!sendId) return;
  try {
    const rows = [
      ...sent.map((email) => ({ sendId, email, status: 'sent' })),
      ...failed.map((f) => ({
        sendId,
        email: f.email,
        status: 'failed',
        error: f.error,
      })),
    ];
    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      await db
        .insert(emailSendRecipients)
        .values(rows.slice(i, i + INSERT_CHUNK));
    }
    await db
      .update(emailSends)
      .set({
        status:
          failed.length === 0
            ? 'sent'
            : sent.length === 0
              ? 'failed'
              : 'partial',
        sentCount: sent.length,
        failedCount: failed.length,
        error: failed.length
          ? [...new Set(failed.map((f) => f.error))].slice(0, 5).join('; ')
          : null,
        completedAt: new Date(),
      })
      .where(eq(emailSends.id, sendId));
  } catch (err) {
    console.error('Send-log finish failed:', err);
  }
}

/** Marks an attempt that crashed before results were known. */
export async function failSendLog(sendId: string | null, error: string) {
  if (!sendId) return;
  try {
    await db
      .update(emailSends)
      .set({ status: 'failed', error, completedAt: new Date() })
      .where(eq(emailSends.id, sendId));
  } catch (err) {
    console.error('Send-log fail update failed:', err);
  }
}
