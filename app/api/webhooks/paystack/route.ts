import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { verifyPaystackSignature } from '@/lib/shop/paystack';
import { completeOrder } from '@/lib/shop/complete-order';
import { POPULAR_PRODUCTS_TAG } from '@/lib/shop/queries';

// Paystack delivers many event shapes; we only act on `charge.success`,
// which always carries `data.reference` and `data.amount`. We parse with
// `.passthrough()` so future fields don't break the webhook.
const paystackEventSchema = z
  .object({
    event: z.string(),
    data: z
      .object({
        reference: z.string().min(1),
        amount: z.number().int().nonnegative(),
      })
      .passthrough(),
  })
  .passthrough();

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('paystack webhook: PAYSTACK_SECRET_KEY not set');
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-paystack-signature') ?? '';
  if (!verifyPaystackSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'bad signature' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const parsed = paystackEventSchema.safeParse(raw);
  // Acknowledge non-charge or unrecognised payloads — Paystack retries on
  // non-2xx, and we don't want them retrying events we don't care about.
  if (!parsed.success || parsed.data.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }
  const { reference, amount } = parsed.data.data;

  const result = await completeOrder(reference, amount);
  if (result.status === 'not_found') {
    console.warn(`paystack webhook: unknown reference ${reference}`);
  }
  // A paid order changes the "most popular" ranking — refresh its cache.
  // (Done here, in a route handler, not in the processing page's render.)
  if (result.status === 'claimed' || result.status === 'already_paid') {
    revalidateTag(POPULAR_PRODUCTS_TAG);
  }
  return NextResponse.json({ received: true });
}
