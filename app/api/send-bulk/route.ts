// app/api/send-bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import mailjet from '@/lib/mailjet';
import { getEmailTemplate } from '@/lib/email-template';
import { normalizeRecipients, sendBulk } from '@/lib/email/bulk-send';
import { startSendLog, finishSendLog, failSendLog } from '@/lib/email/send-log';

export const maxDuration = 60;

const MAX_TOTAL_RECIPIENTS = 600; // Free-plan queue ceiling
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface BulkSendRequest {
  recipients: string[];
  subject: string;
  content: string;
  /** Id of the earlier attempt whose failures this send retries. */
  retryOfId?: string;
}

export async function POST(req: NextRequest) {
  let body: BulkSendRequest;
  try {
    body = (await req.json()) as BulkSendRequest;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { subject, content } = body;
  if (!subject || !content || !Array.isArray(body.recipients)) {
    return NextResponse.json(
      { error: 'Missing required fields.' },
      { status: 400 }
    );
  }

  const recipients = normalizeRecipients(body.recipients);
  if (recipients.length === 0) {
    return NextResponse.json(
      { error: 'Missing required fields.' },
      { status: 400 }
    );
  }
  if (recipients.length > MAX_TOTAL_RECIPIENTS) {
    return NextResponse.json(
      {
        error: `Your list has ${recipients.length} addresses — the Mailjet Free plan queues at most 600. Please upgrade your plan to send larger campaigns.`,
      },
      { status: 422 }
    );
  }

  const html = getEmailTemplate(content);
  const from = {
    Email: process.env.EMAIL_FROM ?? 'info@dysruptivetech.com',
    Name: process.env.EMAIL_FROM_NAME ?? 'Ship With Godday',
  };

  const { userId } = await auth();
  const retryOfId =
    typeof body.retryOfId === 'string' && UUID_RE.test(body.retryOfId)
      ? body.retryOfId
      : null;
  const sendId = await startSendLog({
    subject,
    content,
    requestedBy: userId ?? null,
    retryOfId,
    recipientCount: recipients.length,
  });

  let summary;
  try {
    summary = await sendBulk(recipients, async (batch) => {
      const res = await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: batch.map((email) => ({
          From: from,
          To: [{ Email: email, Name: email.split('@')[0] }],
          Subject: subject,
          HTMLPart: html,
        })),
      });
      return res.body as { Messages?: { Status?: string }[] };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Send-bulk error:', message);
    await failSendLog(sendId, message);
    return NextResponse.json(
      { error: 'Unexpected server error', detail: message, sendId },
      { status: 500 }
    );
  }

  await finishSendLog(sendId, summary);
  const { sent, failed } = summary;

  // Always 200 with a per-recipient breakdown: some emails may already have
  // gone out, and the client must retry only the failures to avoid sending
  // duplicates to everyone else.
  return NextResponse.json({
    success: failed.length === 0,
    sendId,
    sentCount: sent.length,
    failed,
  });
}
