import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/shop/auth';
import {
  getContainersWithSubscriberCounts,
  createContainer,
} from '@/lib/shipment/queries';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  const rows = await getContainersWithSubscriberCounts();
  return NextResponse.json(rows);
}

const createSchema = z.object({
  containerNumber: z.string().trim().min(1),
  etaPort: z.string().datetime().optional().nullable(),
  etaWarehouse: z.string().datetime().optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const { containerNumber, etaPort, etaWarehouse } = parsed.data;
  const container = await createContainer({
    containerNumber,
    etaPort: etaPort ? new Date(etaPort) : null,
    etaWarehouse: etaWarehouse ? new Date(etaWarehouse) : null,
  });

  return NextResponse.json(container, { status: 201 });
}
