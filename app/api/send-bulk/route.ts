// app/api/send-bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mailjet from '@/lib/mailjet';
import { getEmailTemplate } from '@/lib/email-template';
import pLimit from 'p-limit';

/* ────────────────────────────────────
   Config
   ──────────────────────────────────── */
const MAX_RECIPIENTS_PER_CALL = 50; // Mailjet v3.1 hard-cap
const MAX_TOTAL_RECIPIENTS = 600; // Free-plan queue ceiling
const CONCURRENCY = 20; // keeps us <500 calls / 10 s

/* ────────────────────────────────────
   Local helper types
   ──────────────────────────────────── */
interface BulkSendRequest {
  recipients: string[];
  subject: string;
  content: string;
}

type MailjetStatus = 'success' | 'queued' | 'error' | string;

interface MailjetMessage {
  Status: MailjetStatus;
}

interface MailjetSendResponse {
  body: {
    Messages: MailjetMessage[];
  };
}

/* ────────────────────────────────────
   POST
   ──────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, content } =
      (await req.json()) as BulkSendRequest;

    /* 1 ▸ validation */
    if (
      !recipients ||
      !subject ||
      !content ||
      !Array.isArray(recipients) ||
      recipients.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    /* 2 ▸ hard-cap at 600 */
    if (recipients.length > MAX_TOTAL_RECIPIENTS) {
      return NextResponse.json(
        {
          error: `Your list has ${recipients.length} addresses — the Mailjet Free plan queues at most 600. Please upgrade your plan to send larger campaigns.`,
        },
        { status: 422 }
      );
    }

    /* 3 ▸ chunk into ≤50-recipient batches */
    const batches: string[][] = [];
    for (
      let i = 0;
      i < recipients.length;
      i += MAX_RECIPIENTS_PER_CALL
    ) {
      batches.push(recipients.slice(i, i + MAX_RECIPIENTS_PER_CALL));
    }

    /* 4 ▸ throttle concurrent calls */
    const limit = pLimit(CONCURRENCY);

    /* 5 ▸ send */
    const batchResults = await Promise.all(
      batches.map((batch) =>
        limit(async () => {
          const messages = batch.map((email) => ({
            From: {
              Email:
                process.env.EMAIL_FROM ?? 'info@dysruptivetech.com',
              Name: process.env.EMAIL_FROM_NAME ?? 'Ship With Godday',
            },
            To: [{ Email: email, Name: email.split('@')[0] }],
            Subject: subject,
            HTMLPart: getEmailTemplate(content),
          }));

          const mjRes = (await mailjet
            .post('send', { version: 'v3.1' })
            .request({ Messages: messages })) as MailjetSendResponse;

          return mjRes.body.Messages.map((m) => m.Status);
        })
      )
    );

    /* 6 ▸ summarise */
    const statuses: MailjetStatus[] = batchResults.flat();
    const deliveredNow = statuses.filter(
      (s) => s === 'success'
    ).length;
    const queued = statuses.filter((s) => s === 'queued').length;

    return NextResponse.json({
      success: true,
      deliveredNow,
      queued,
      note: queued
        ? 'Queued messages will leave Mailjet automatically at up to 200 per UTC-day.'
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Send-bulk error:', message);
    return NextResponse.json(
      { error: 'Unexpected server error', detail: message },
      { status: 500 }
    );
  }
}
