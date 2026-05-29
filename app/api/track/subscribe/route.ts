import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveInvoice, upsertSubscriber } from '@/lib/shipment/queries';

const bodySchema = z.object({
  invoiceNumber: z.string().trim().min(1),
  emailOverride: z.string().email().optional().nullable(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { invoiceNumber, emailOverride } = parsed.data;
  const resolved = await resolveInvoice(invoiceNumber);

  if (!resolved || !resolved.container) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const { container, customer } = resolved;

  const hasEmail = !!customer?.email || !!emailOverride;
  if (!hasEmail) {
    return NextResponse.json(
      { error: 'An email address is required' },
      { status: 400 }
    );
  }

  await upsertSubscriber(
    container.id,
    customer?.id ?? null,
    invoiceNumber,
    emailOverride ?? null
  );

  return NextResponse.json({ success: true });
}
