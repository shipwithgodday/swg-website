export const MAX_RECIPIENTS_PER_CALL = 50; // Mailjet v3.1 hard-cap
const CONCURRENCY = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface MailjetMessageResult {
  Status?: string;
  Errors?: { ErrorMessage?: string; ErrorCode?: string }[];
}

/** Sends one Mailjet v3.1 batch. Resolves with the body, or throws like node-mailjet. */
export type SendBatch = (
  emails: string[]
) => Promise<{ Messages?: MailjetMessageResult[] }>;

export interface RecipientFailure {
  email: string;
  error: string;
}

export interface BulkSendSummary {
  sent: string[];
  failed: RecipientFailure[];
}

/** Trims, drops blanks and removes case-insensitive duplicates. */
export function normalizeRecipients(recipients: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of recipients) {
    if (typeof raw !== 'string') continue;
    const email = raw.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}

function messageError(m: MailjetMessageResult | undefined): string {
  const first = m?.Errors?.[0];
  return first?.ErrorMessage ?? first?.ErrorCode ?? 'Rejected by Mailjet';
}

/**
 * Sends to every recipient in ≤50-address batches and reports the outcome
 * per recipient. A failing batch never aborts the others, and Mailjet's
 * per-message statuses are read even from an error response (v3.1 still
 * sends the valid messages of a batch that contains a bad one), so callers
 * can retry exactly the addresses that failed instead of resending to all.
 */
export async function sendBulk(
  recipients: string[],
  sendBatch: SendBatch
): Promise<BulkSendSummary> {
  const sent: string[] = [];
  const failed: RecipientFailure[] = [];

  const valid: string[] = [];
  for (const email of normalizeRecipients(recipients)) {
    if (EMAIL_RE.test(email)) valid.push(email);
    else failed.push({ email, error: 'Invalid email address' });
  }

  const batches: string[][] = [];
  for (let i = 0; i < valid.length; i += MAX_RECIPIENTS_PER_CALL) {
    batches.push(valid.slice(i, i + MAX_RECIPIENTS_PER_CALL));
  }

  // Small worker pool: at most CONCURRENCY Mailjet calls in flight.
  let next = 0;
  const runBatch = async (batch: string[]) => {
    let messages: MailjetMessageResult[] | undefined;
    let batchError: string | undefined;
    try {
      messages = (await sendBatch(batch)).Messages;
    } catch (err) {
      const e = err as {
        response?: { data?: { Messages?: MailjetMessageResult[] } };
        message?: string;
      };
      messages = e.response?.data?.Messages;
      batchError = e.message ?? String(err);
      console.error('Send-bulk batch error:', batchError);
    }

    batch.forEach((email, i) => {
      const m = messages?.[i];
      if (m?.Status === 'success' || m?.Status === 'queued') {
        sent.push(email);
      } else if (m) {
        failed.push({ email, error: messageError(m) });
      } else {
        // No per-message status (network error, auth, rate limit…):
        // Mailjet rejected the whole call, so nothing in it was sent.
        failed.push({ email, error: batchError ?? 'No response from Mailjet' });
      }
    });
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
      while (next < batches.length) await runBatch(batches[next++]);
    })
  );

  return { sent, failed };
}
