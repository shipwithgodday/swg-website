import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/shop/auth';
import {
  markContainerArrived,
  unmarkContainerArrived,
} from '@/lib/shipment/queries';
import { sendArrivalNotifications } from '@/lib/shipment/notifications';

const bodySchema = z.object({
  milestone: z.enum(['port', 'warehouse']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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

  const { milestone } = parsed.data;

  let updated;
  try {
    updated = await markContainerArrived(id, milestone);
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    throw err;
  }

  sendArrivalNotifications(updated, milestone).catch((err) =>
    console.error('sendArrivalNotifications failed:', err)
  );

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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

  const { milestone } = parsed.data;

  let updated;
  try {
    updated = await unmarkContainerArrived(id, milestone);
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) {
      return NextResponse.json({ error: 'Container not found' }, { status: 404 });
    }
    throw err;
  }

  return NextResponse.json(updated);
}
