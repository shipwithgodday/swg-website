import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  containers,
  customers,
  etaAdjustments,
  shipmentNotificationSubscribers,
  type Container,
  type EtaAdjustment,
  type ShipmentNotificationSubscriber,
} from '@/lib/db/schema';
import { parseInvoiceNumber } from './parseInvoice';

export type ResolvedInvoice = {
  containerNumber: string;
  shippingMark: string;
  container: Container | null;
  customer: { id: string; name: string | null; email: string | null } | null;
};

export async function resolveInvoice(
  invoiceNumber: string
): Promise<ResolvedInvoice | null> {
  const allMarks = await db
    .select({ shippingMark: customers.shippingMark })
    .from(customers);
  const marks = allMarks.map((r) => r.shippingMark);

  const parsed = parseInvoiceNumber(invoiceNumber, marks);
  if (!parsed) return null;

  const [container] = await db
    .select()
    .from(containers)
    .where(eq(containers.containerNumber, parsed.containerNumber));

  const [customer] = await db
    .select({ id: customers.id, name: customers.name, email: customers.email })
    .from(customers)
    .where(eq(customers.shippingMark, parsed.shippingMark));

  return {
    containerNumber: parsed.containerNumber,
    shippingMark: parsed.shippingMark,
    container: container ?? null,
    customer: customer ?? null,
  };
}

export type ContainerRow = Container & { subscriberCount: number };

export async function getContainersWithSubscriberCounts(): Promise<ContainerRow[]> {
  const rows = await db
    .select({
      id: containers.id,
      containerNumber: containers.containerNumber,
      etaPort: containers.etaPort,
      etaWarehouse: containers.etaWarehouse,
      arrivedAtPort: containers.arrivedAtPort,
      arrivedAtWarehouse: containers.arrivedAtWarehouse,
      createdAt: containers.createdAt,
      updatedAt: containers.updatedAt,
      subscriberCount: sql<number>`count(${shipmentNotificationSubscribers.id})::int`,
    })
    .from(containers)
    .leftJoin(
      shipmentNotificationSubscribers,
      eq(shipmentNotificationSubscribers.containerId, containers.id)
    )
    .groupBy(containers.id)
    .orderBy(containers.createdAt);

  return rows.map((r) => ({ ...r, subscriberCount: r.subscriberCount ?? 0 }));
}

export async function createContainer(data: {
  containerNumber: string;
  etaPort?: Date | null;
  etaWarehouse?: Date | null;
}): Promise<Container> {
  const [row] = await db
    .insert(containers)
    .values({
      containerNumber: data.containerNumber.toUpperCase().trim(),
      etaPort: data.etaPort ?? null,
      etaWarehouse: data.etaWarehouse ?? null,
    })
    .returning();
  return row;
}

export async function updateContainerEtas(
  id: string,
  updates: {
    etaPort?: Date | null;
    etaWarehouse?: Date | null;
    etaPortReason?: string | null;
    etaWarehouseReason?: string | null;
  },
  adjustedBy: string
): Promise<{ before: Container; updated: Container }> {
  const [current] = await db
    .select()
    .from(containers)
    .where(eq(containers.id, id));
  if (!current) throw new Error(`Container ${id} not found`);

  const updatePayload: Partial<typeof containers.$inferInsert> = {};

  if (
    'etaPort' in updates &&
    updates.etaPort?.getTime() !== current.etaPort?.getTime()
  ) {
    updatePayload.etaPort = updates.etaPort ?? null;
    if (updates.etaPort !== null && updates.etaPort !== undefined) {
      await db.insert(etaAdjustments).values({
        containerId: id,
        field: 'etaPort',
        previousDate: current.etaPort ?? null,
        newDate: updates.etaPort,
        reason: updates.etaPortReason ?? null,
        adjustedBy,
      });
    }
  }

  if (
    'etaWarehouse' in updates &&
    updates.etaWarehouse?.getTime() !== current.etaWarehouse?.getTime()
  ) {
    updatePayload.etaWarehouse = updates.etaWarehouse ?? null;
    if (updates.etaWarehouse !== null && updates.etaWarehouse !== undefined) {
      await db.insert(etaAdjustments).values({
        containerId: id,
        field: 'etaWarehouse',
        previousDate: current.etaWarehouse ?? null,
        newDate: updates.etaWarehouse,
        reason: updates.etaWarehouseReason ?? null,
        adjustedBy,
      });
    }
  }

  if (Object.keys(updatePayload).length === 0) return { before: current, updated: current };

  const [updated] = await db
    .update(containers)
    .set(updatePayload)
    .where(eq(containers.id, id))
    .returning();
  if (!updated) throw new Error(`Container ${id} not found after update`);
  return { before: current, updated };
}

export async function getAdjustmentLog(
  containerId: string
): Promise<EtaAdjustment[]> {
  return db
    .select()
    .from(etaAdjustments)
    .where(eq(etaAdjustments.containerId, containerId))
    .orderBy(etaAdjustments.adjustedAt);
}

export async function markContainerArrived(
  id: string,
  milestone: 'port' | 'warehouse'
): Promise<Container> {
  const col =
    milestone === 'port'
      ? { arrivedAtPort: new Date() }
      : { arrivedAtWarehouse: new Date() };

  const [updated] = await db
    .update(containers)
    .set(col)
    .where(eq(containers.id, id))
    .returning();
  if (!updated) throw new Error(`Container ${id} not found`);
  return updated;
}

export async function upsertSubscriber(
  containerId: string,
  customerId: string | null,
  invoiceNumber: string,
  emailOverride?: string | null
): Promise<void> {
  await db
    .insert(shipmentNotificationSubscribers)
    .values({
      containerId,
      customerId,
      invoiceNumber: invoiceNumber.toUpperCase().trim(),
      emailOverride: emailOverride ?? null,
    })
    .onConflictDoNothing();
}

export async function getSubscribersForContainer(
  containerId: string
): Promise<
  (ShipmentNotificationSubscriber & {
    customerEmail: string | null;
    customerName: string | null;
  })[]
> {
  const rows = await db
    .select({
      id: shipmentNotificationSubscribers.id,
      containerId: shipmentNotificationSubscribers.containerId,
      customerId: shipmentNotificationSubscribers.customerId,
      emailOverride: shipmentNotificationSubscribers.emailOverride,
      invoiceNumber: shipmentNotificationSubscribers.invoiceNumber,
      subscribedAt: shipmentNotificationSubscribers.subscribedAt,
      notifiedPortArrival:
        shipmentNotificationSubscribers.notifiedPortArrival,
      notifiedWarehouseArrival:
        shipmentNotificationSubscribers.notifiedWarehouseArrival,
      notifiedPortArrived:
        shipmentNotificationSubscribers.notifiedPortArrived,
      notifiedWarehouseArrived:
        shipmentNotificationSubscribers.notifiedWarehouseArrived,
      customerEmail: customers.email,
      customerName: customers.name,
    })
    .from(shipmentNotificationSubscribers)
    .leftJoin(
      customers,
      eq(shipmentNotificationSubscribers.customerId, customers.id)
    )
    .where(
      eq(shipmentNotificationSubscribers.containerId, containerId)
    );
  return rows;
}

export async function markSubscriberNotified(
  subscriberId: string,
  field:
    | 'notifiedPortArrival'
    | 'notifiedWarehouseArrival'
    | 'notifiedPortArrived'
    | 'notifiedWarehouseArrived'
): Promise<void> {
  const payload =
    field === 'notifiedPortArrival'
      ? { notifiedPortArrival: true as const }
      : field === 'notifiedWarehouseArrival'
      ? { notifiedWarehouseArrival: true as const }
      : field === 'notifiedPortArrived'
      ? { notifiedPortArrived: true as const }
      : { notifiedWarehouseArrived: true as const };
  await db
    .update(shipmentNotificationSubscribers)
    .set(payload)
    .where(eq(shipmentNotificationSubscribers.id, subscriberId));
}

export async function resetSubscriberNotified(
  subscriberId: string,
  field: 'notifiedPortArrival' | 'notifiedWarehouseArrival'
): Promise<void> {
  const payload =
    field === 'notifiedPortArrival'
      ? { notifiedPortArrival: false as const }
      : { notifiedWarehouseArrival: false as const };
  await db
    .update(shipmentNotificationSubscribers)
    .set(payload)
    .where(eq(shipmentNotificationSubscribers.id, subscriberId));
}
