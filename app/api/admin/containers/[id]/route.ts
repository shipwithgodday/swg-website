import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { isAdmin } from '@/lib/shop/auth';
import { updateContainerEtas } from '@/lib/shipment/queries';
import { db } from '@/lib/db';
import { containers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendShipmentNotifications } from '@/lib/shipment/notifications';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const patchSchema = z.object({
  etaPort: z.string().datetime().optional().nullable(),
  etaWarehouse: z.string().datetime().optional().nullable(),
  etaPortReason: z.string().optional().nullable(),
  etaWarehouseReason: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) return unauthorized();

  const { id } = await params;
  const { userId } = await auth();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  // Load current state before update to detect reschedules
  const [before] = await db
    .select()
    .from(containers)
    .where(eq(containers.id, id));

  if (!before) {
    return NextResponse.json({ error: 'Container not found' }, { status: 404 });
  }

  const { etaPort, etaWarehouse, etaPortReason, etaWarehouseReason } =
    parsed.data;

  const updates: Parameters<typeof updateContainerEtas>[1] = {};
  if ('etaPort' in parsed.data) {
    updates.etaPort = etaPort ? new Date(etaPort) : null;
    updates.etaPortReason = etaPortReason ?? null;
  }
  if ('etaWarehouse' in parsed.data) {
    updates.etaWarehouse = etaWarehouse ? new Date(etaWarehouse) : null;
    updates.etaWarehouseReason = etaWarehouseReason ?? null;
  }

  const updated = await updateContainerEtas(id, updates, userId ?? 'admin');

  // Detect which fields actually changed for notification purposes
  const portChanged =
    'etaPort' in updates &&
    updates.etaPort?.getTime() !== before.etaPort?.getTime();
  const warehouseChanged =
    'etaWarehouse' in updates &&
    updates.etaWarehouse?.getTime() !== before.etaWarehouse?.getTime();

  if (portChanged || warehouseChanged) {
    // Fire-and-forget — don't block the response
    sendShipmentNotifications(updated, {
      etaPort: portChanged,
      etaWarehouse: warehouseChanged,
      etaPortReason: etaPortReason ?? null,
      etaWarehouseReason: etaWarehouseReason ?? null,
      etaPortWasPreviouslySet: !!before.etaPort,
      etaWarehouseWasPreviouslySet: !!before.etaWarehouse,
    }).catch((err) =>
      console.error('sendShipmentNotifications failed:', err)
    );
  }

  return NextResponse.json(updated);
}
