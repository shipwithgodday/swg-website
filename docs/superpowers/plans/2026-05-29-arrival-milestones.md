# Arrival Milestone Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins manually mark a container as arrived at Tema Port or Ghana Warehouse, triggering a one-time "has arrived" email to all subscribers — separate from the existing ETA heads-up emails.

**Architecture:** Four new DB columns (two on `containers`, two on `shipmentNotificationSubscribers`), a new `markContainerArrived` query, a new `sendArrivalNotifications` function, one new API route (`POST /api/admin/containers/[id]/arrive`), arrival state surfaced in `ContainerTable` cells, and the public `/track` page updated to show arrived status.

**Tech Stack:** Drizzle ORM, PostgreSQL, Next.js 15 App Router, Resend, shadcn/ui, Tailwind CSS, Jest + ts-jest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `lib/db/schema.ts` | Modify | Add `arrivedAtPort`, `arrivedAtWarehouse` to containers; `notifiedPortArrived`, `notifiedWarehouseArrived` to subscribers |
| `drizzle/` | Generate | Migration for new columns |
| `lib/shipment/queries.ts` | Modify | Add `markContainerArrived`; extend `markSubscriberNotified` union; update `getContainersWithSubscriberCounts` and `getSubscribersForContainer` to include new fields |
| `lib/shipment/notifications.ts` | Modify | Add `sendArrivalNotifications` |
| `app/api/admin/containers/[id]/arrive/route.ts` | Create | `POST` handler — mark arrived + fire notifications |
| `components/admin/ContainerTable.tsx` | Modify | Show arrival status in ETA cells; add `onMarkArrived` prop |
| `app/admin/shipments/page.tsx` | Modify | Pass `onMarkArrived` handler with loading state |
| `app/api/track/route.ts` | Modify | Add `arrivedAtPort`, `arrivedAtWarehouse` to response |
| `app/(shop)/track/page.tsx` | Modify | Show "Arrived" status instead of ETA when arrived |

---

## Task 1: Schema — Four New Columns + Migration

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Add arrivedAtPort and arrivedAtWarehouse to the containers table**

In `lib/db/schema.ts`, find the `containers` table definition:

```ts
export const containers = pgTable('containers', {
  id: uuid('id').primaryKey().defaultRandom(),
  containerNumber: text('container_number').notNull().unique(),
  etaPort: timestamp('eta_port', { withTimezone: true }),
  etaWarehouse: timestamp('eta_warehouse', { withTimezone: true }),
  ...timestamps,
});
```

Replace with:

```ts
export const containers = pgTable('containers', {
  id: uuid('id').primaryKey().defaultRandom(),
  containerNumber: text('container_number').notNull().unique(),
  etaPort: timestamp('eta_port', { withTimezone: true }),
  etaWarehouse: timestamp('eta_warehouse', { withTimezone: true }),
  arrivedAtPort: timestamp('arrived_at_port', { withTimezone: true }),
  arrivedAtWarehouse: timestamp('arrived_at_warehouse', { withTimezone: true }),
  ...timestamps,
});
```

- [ ] **Step 2: Add notifiedPortArrived and notifiedWarehouseArrived to subscribers**

Find the `shipmentNotificationSubscribers` table. It currently ends with:

```ts
    notifiedPortArrival: boolean('notified_port_arrival')
      .notNull()
      .default(false),
    notifiedWarehouseArrival: boolean('notified_warehouse_arrival')
      .notNull()
      .default(false),
  },
```

Add two more boolean columns before the closing `},`:

```ts
    notifiedPortArrival: boolean('notified_port_arrival')
      .notNull()
      .default(false),
    notifiedWarehouseArrival: boolean('notified_warehouse_arrival')
      .notNull()
      .default(false),
    notifiedPortArrived: boolean('notified_port_arrived')
      .notNull()
      .default(false),
    notifiedWarehouseArrived: boolean('notified_warehouse_arrived')
      .notNull()
      .default(false),
  },
```

- [ ] **Step 3: Generate migration**

```bash
cd /Users/joel/Documents/lucky-godday && pnpm drizzle-kit generate
```

Expected: new `.sql` file in `drizzle/` containing `ALTER TABLE "containers" ADD COLUMN "arrived_at_port"` and `ALTER TABLE "containers" ADD COLUMN "arrived_at_warehouse"` and two `ALTER TABLE "shipment_notification_subscribers" ADD COLUMN` statements.

- [ ] **Step 4: Apply migration**

```bash
cd /Users/joel/Documents/lucky-godday && pnpm drizzle-kit migrate
```

Expected: migration applied with no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/joel/Documents/lucky-godday
git add lib/db/schema.ts drizzle/
git commit -m "feat(shipment): add arrival timestamp and notified-arrived columns"
```

---

## Task 2: Query Layer Updates

**Files:**
- Modify: `lib/shipment/queries.ts`

- [ ] **Step 1: Update getContainersWithSubscriberCounts to include arrival fields**

The function currently selects specific columns from `containers`. Find the `select({...})` block inside `getContainersWithSubscriberCounts` and add the two new fields:

```ts
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
```

- [ ] **Step 2: Update getSubscribersForContainer to include the two new flags**

Find the `select({...})` block inside `getSubscribersForContainer`. After `notifiedWarehouseArrival`, add:

```ts
      notifiedPortArrived:
        shipmentNotificationSubscribers.notifiedPortArrived,
      notifiedWarehouseArrived:
        shipmentNotificationSubscribers.notifiedWarehouseArrived,
```

- [ ] **Step 3: Add markContainerArrived function**

Add this function after `getAdjustmentLog`:

```ts
export async function markContainerArrived(
  id: string,
  milestone: 'port' | 'warehouse'
): Promise<Container> {
  const field =
    milestone === 'port' ? 'arrivedAtPort' : 'arrivedAtWarehouse';
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
```

- [ ] **Step 4: Extend markSubscriberNotified to accept the two new flag names**

Find `markSubscriberNotified`. Replace it with:

```ts
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
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/joel/Documents/lucky-godday && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/joel/Documents/lucky-godday
git add lib/shipment/queries.ts
git commit -m "feat(shipment): add markContainerArrived, extend markSubscriberNotified, surface arrival fields"
```

---

## Task 3: Arrival Notification Emails

**Files:**
- Modify: `lib/shipment/notifications.ts`

- [ ] **Step 1: Add arrival email builder functions**

Open `lib/shipment/notifications.ts`. After the existing `buildWarehouseEmail` function (around line 75), add two new builders:

```ts
function buildPortArrivedEmail(opts: {
  recipientName: string | null;
  invoiceNumber: string;
}): { subject: string; html: string } {
  const name = opts.recipientName ?? 'Valued Customer';
  const html = `
    <p>Hi ${name},</p>
    <p>Great news — your shipment <strong>${opts.invoiceNumber}</strong> has arrived at <strong>Tema Port</strong> and is being processed.</p>
    <p><a href="${BASE_URL}/track?invoice=${opts.invoiceNumber}">View full shipment status →</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">Ship With Godday &mdash; Lucky Godday Business Services</p>
  `;
  return {
    subject: `Your shipment ${opts.invoiceNumber} has arrived at Tema Port`,
    html,
  };
}

function buildWarehouseArrivedEmail(opts: {
  recipientName: string | null;
  invoiceNumber: string;
}): { subject: string; html: string } {
  const name = opts.recipientName ?? 'Valued Customer';
  const html = `
    <p>Hi ${name},</p>
    <p>Great news — your shipment <strong>${opts.invoiceNumber}</strong> is ready for collection at our <strong>Ghana Warehouse</strong>.</p>
    <p><a href="${BASE_URL}/track?invoice=${opts.invoiceNumber}">View full shipment status →</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#888;font-size:12px">Ship With Godday &mdash; Lucky Godday Business Services</p>
  `;
  return {
    subject: `Your shipment ${opts.invoiceNumber} is ready at our Ghana Warehouse`,
    html,
  };
}
```

- [ ] **Step 2: Add sendArrivalNotifications function**

At the bottom of the file, after `sendShipmentNotifications`, add:

```ts
export async function sendArrivalNotifications(
  container: Container,
  milestone: 'port' | 'warehouse'
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('sendArrivalNotifications: RESEND_API_KEY not set, skipping');
    return;
  }

  const subscribers = await getSubscribersForContainer(container.id);

  for (const sub of subscribers) {
    const email = sub.emailOverride ?? sub.customerEmail ?? null;
    if (!email) {
      console.warn(
        `sendArrivalNotifications: no email for subscriber ${sub.id} (invoice ${sub.invoiceNumber}), skipping`
      );
      continue;
    }

    const alreadyNotified =
      milestone === 'port'
        ? sub.notifiedPortArrived
        : sub.notifiedWarehouseArrived;

    if (alreadyNotified) continue;

    const { subject, html } =
      milestone === 'port'
        ? buildPortArrivedEmail({
            recipientName: sub.customerName,
            invoiceNumber: sub.invoiceNumber,
          })
        : buildWarehouseArrivedEmail({
            recipientName: sub.customerName,
            invoiceNumber: sub.invoiceNumber,
          });

    try {
      const result = await resend.emails.send({
        from: FROM,
        to: [email],
        subject,
        html,
      });
      if (result.error) {
        console.error(
          `sendArrivalNotifications: Resend error to ${email}: ${result.error.message}`
        );
      } else {
        const flag =
          milestone === 'port'
            ? 'notifiedPortArrived'
            : 'notifiedWarehouseArrived';
        await markSubscriberNotified(sub.id, flag);
        console.log(
          `sendArrivalNotifications: sent ${milestone} arrival to ${email} (id ${result.data?.id})`
        );
      }
    } catch (err) {
      console.error(
        `sendArrivalNotifications: unexpected error sending ${milestone} arrival`,
        err
      );
    }
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/joel/Documents/lucky-godday && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/joel/Documents/lucky-godday
git add lib/shipment/notifications.ts
git commit -m "feat(shipment): add sendArrivalNotifications with port and warehouse email templates"
```

---

## Task 4: API Route — POST /api/admin/containers/[id]/arrive

**Files:**
- Create: `app/api/admin/containers/[id]/arrive/route.ts`

- [ ] **Step 1: Create the route file**

Create `app/api/admin/containers/[id]/arrive/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/shop/auth';
import { markContainerArrived } from '@/lib/shipment/queries';
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

  // Check if already arrived before we set it — markContainerArrived always
  // overwrites, so guard against re-notifying by checking the field on the
  // container returned. We fire notifications on every mark-arrived call
  // (including re-marks) but the sendArrivalNotifications function skips
  // subscribers whose notifiedPortArrived / notifiedWarehouseArrived is true.
  sendArrivalNotifications(updated, milestone).catch((err) =>
    console.error('sendArrivalNotifications failed:', err)
  );

  return NextResponse.json(updated);
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/joel/Documents/lucky-godday && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/joel/Documents/lucky-godday
git add app/api/admin/containers/[id]/arrive/
git commit -m "feat(shipment): add POST /api/admin/containers/[id]/arrive"
```

---

## Task 5: Admin UI — ContainerTable + Shipments Page

**Files:**
- Modify: `components/admin/ContainerTable.tsx`
- Modify: `app/admin/shipments/page.tsx`

- [ ] **Step 1: Rewrite ContainerTable to show arrival state in ETA cells**

Replace the entire file `components/admin/ContainerTable.tsx` with:

```tsx
'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { Ship, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ContainerRow } from '@/lib/shipment/queries';

interface Props {
  containers: ContainerRow[];
  onEdit: (container: ContainerRow) => void;
  onArrivalMarked: () => void;
}

function formatDate(date: Date | null): string {
  if (!date) return 'Not set';
  return format(date, 'd MMM yyyy');
}

function EtaCell({
  containerId,
  eta,
  arrived,
  milestone,
  onArrivalMarked,
}: {
  containerId: string;
  eta: Date | null;
  arrived: Date | null;
  milestone: 'port' | 'warehouse';
  onArrivalMarked: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleMarkArrived() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/containers/${containerId}/arrive`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestone }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? 'Failed to mark arrived');
        return;
      }
      toast.success(
        milestone === 'port'
          ? 'Marked as arrived at Tema Port'
          : 'Marked as arrived at Ghana Warehouse'
      );
      onArrivalMarked();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (arrived) {
    return (
      <div>
        <p className="text-xs text-zinc-400 line-through">{formatDate(eta)}</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          ✓ Arrived {formatDate(arrived)}
        </span>
      </div>
    );
  }

  return (
    <div>
      <p className={eta ? 'text-zinc-900 text-sm' : 'text-zinc-400 text-sm'}>
        {formatDate(eta)}
      </p>
      {eta && (
        <button
          type="button"
          onClick={handleMarkArrived}
          disabled={loading}
          className="mt-0.5 text-xs text-zinc-400 underline hover:text-zinc-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving…' : 'Mark arrived'}
        </button>
      )}
    </div>
  );
}

export function ContainerTable({ containers, onEdit, onArrivalMarked }: Props) {
  if (containers.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200/70 bg-white p-10 text-center shadow-sm">
        <Ship className="mx-auto mb-3 size-8 text-zinc-300" />
        <p className="text-sm text-zinc-400">No containers yet. Add one below.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50">
            <TableHead>Container</TableHead>
            <TableHead>
              <span className="flex items-center gap-1.5">
                <Ship className="size-3.5" /> Tema Port
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-1.5">
                <Warehouse className="size-3.5" /> Ghana Warehouse
              </span>
            </TableHead>
            <TableHead className="text-right">Subscribers</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono font-semibold text-zinc-900">
                {c.containerNumber}
              </TableCell>
              <TableCell>
                <EtaCell
                  containerId={c.id}
                  eta={c.etaPort}
                  arrived={c.arrivedAtPort}
                  milestone="port"
                  onArrivalMarked={onArrivalMarked}
                />
              </TableCell>
              <TableCell>
                <EtaCell
                  containerId={c.id}
                  eta={c.etaWarehouse}
                  arrived={c.arrivedAtWarehouse}
                  milestone="warehouse"
                  onArrivalMarked={onArrivalMarked}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums text-zinc-600">
                {c.subscriberCount}
              </TableCell>
              <TableCell className="text-right">
                <button
                  type="button"
                  onClick={() => onEdit(c)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                  Edit ETAs
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Update app/admin/shipments/page.tsx to pass onArrivalMarked**

Open `app/admin/shipments/page.tsx`. Find the `<ContainerTable` JSX. It currently looks like:

```tsx
        <ContainerTable containers={containers} onEdit={handleEdit} />
```

Replace with:

```tsx
        <ContainerTable
          containers={containers}
          onEdit={handleEdit}
          onArrivalMarked={loadContainers}
        />
```

Also update the `loadContainers` date conversion — it currently converts `etaPort` and `etaWarehouse`. Add conversion for the two new fields. Find the `.then((rows: Array<Record<string, unknown>>) =>` block and add:

```ts
          arrivedAtPort: r.arrivedAtPort
            ? new Date(r.arrivedAtPort as string)
            : null,
          arrivedAtWarehouse: r.arrivedAtWarehouse
            ? new Date(r.arrivedAtWarehouse as string)
            : null,
```

The full updated `loadContainers` should be:

```ts
  async function loadContainers() {
    fetch('/api/admin/containers')
      .then((r) => r.json())
      .then((rows: Array<Record<string, unknown>>) =>
        rows.map((r) => ({
          ...r,
          etaPort: r.etaPort ? new Date(r.etaPort as string) : null,
          etaWarehouse: r.etaWarehouse
            ? new Date(r.etaWarehouse as string)
            : null,
          arrivedAtPort: r.arrivedAtPort
            ? new Date(r.arrivedAtPort as string)
            : null,
          arrivedAtWarehouse: r.arrivedAtWarehouse
            ? new Date(r.arrivedAtWarehouse as string)
            : null,
          createdAt: new Date(r.createdAt as string),
          updatedAt: new Date(r.updatedAt as string),
        }))
      )
      .then(setContainers as (v: unknown) => void)
      .catch(console.error);
  }
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/joel/Documents/lucky-godday && pnpm tsc --noEmit 2>&1 | head -30
```

Fix any errors before committing.

- [ ] **Step 4: Commit**

```bash
cd /Users/joel/Documents/lucky-godday
git add components/admin/ContainerTable.tsx app/admin/shipments/page.tsx
git commit -m "feat(shipment): show arrival status and mark-arrived action in ContainerTable"
```

---

## Task 6: Public Track Page — Show Arrived Status

**Files:**
- Modify: `app/api/track/route.ts`
- Modify: `app/(shop)/track/page.tsx`

- [ ] **Step 1: Add arrivedAtPort and arrivedAtWarehouse to GET /api/track response**

Open `app/api/track/route.ts`. Find the `return NextResponse.json({...})` call. Add the two new fields:

```ts
  return NextResponse.json({
    found: true,
    invoiceNumber: invoice.toUpperCase().trim(),
    containerNumber: resolved.containerNumber,
    customer: customer
      ? {
          name: customer.name,
          hasEmail: !!customer.email,
          maskedEmail: customer.email ? maskEmail(customer.email) : null,
        }
      : null,
    etaPort: container.etaPort?.toISOString() ?? null,
    etaWarehouse: container.etaWarehouse?.toISOString() ?? null,
    arrivedAtPort: container.arrivedAtPort?.toISOString() ?? null,
    arrivedAtWarehouse: container.arrivedAtWarehouse?.toISOString() ?? null,
  });
```

- [ ] **Step 2: Update TrackResult type in the track page**

Open `app/(shop)/track/page.tsx`. Find the `TrackResult` type:

```ts
type TrackResult =
  | {
      found: true;
      invoiceNumber: string;
      containerNumber: string;
      customer: {
        name: string | null;
        hasEmail: boolean;
        maskedEmail: string | null;
      } | null;
      etaPort: string | null;
      etaWarehouse: string | null;
    }
  | { found: false };
```

Add the two new fields to the `found: true` branch:

```ts
type TrackResult =
  | {
      found: true;
      invoiceNumber: string;
      containerNumber: string;
      customer: {
        name: string | null;
        hasEmail: boolean;
        maskedEmail: string | null;
      } | null;
      etaPort: string | null;
      etaWarehouse: string | null;
      arrivedAtPort: string | null;
      arrivedAtWarehouse: string | null;
    }
  | { found: false };
```

- [ ] **Step 3: Update the ETA display in the result card**

The track page currently shows ETA rows using `formatEta`. Find the two ETA rows in the result card JSX — they look like:

```tsx
                <div className="flex items-center gap-3">
                  <Ship className="size-5 shrink-0 text-[#00254F]" />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      ETA — Tema Port
                    </p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatEta(result.etaPort)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Warehouse className="size-5 shrink-0 text-[#00254F]" />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      ETA — Ghana Warehouse
                    </p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatEta(result.etaWarehouse)}
                    </p>
                  </div>
                </div>
```

Replace with:

```tsx
                <div className="flex items-center gap-3">
                  <Ship className="size-5 shrink-0 text-[#00254F]" />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      {result.arrivedAtPort ? 'Arrived — Tema Port' : 'ETA — Tema Port'}
                    </p>
                    {result.arrivedAtPort ? (
                      <p className="text-sm font-semibold text-green-700">
                        ✓ Arrived {format(new Date(result.arrivedAtPort), 'd MMMM yyyy')}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatEta(result.etaPort)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Warehouse className="size-5 shrink-0 text-[#00254F]" />
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      {result.arrivedAtWarehouse ? 'Arrived — Ghana Warehouse' : 'ETA — Ghana Warehouse'}
                    </p>
                    {result.arrivedAtWarehouse ? (
                      <p className="text-sm font-semibold text-green-700">
                        ✓ Arrived {format(new Date(result.arrivedAtWarehouse), 'd MMMM yyyy')}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatEta(result.etaWarehouse)}
                      </p>
                    )}
                  </div>
                </div>
```

- [ ] **Step 4: TypeScript check + tests**

```bash
cd /Users/joel/Documents/lucky-godday && pnpm tsc --noEmit 2>&1 | head -20
```

```bash
cd /Users/joel/Documents/lucky-godday && pnpm jest --no-coverage 2>&1 | tail -10
```

Expected: no type errors, all 76 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/joel/Documents/lucky-godday
git add app/api/track/route.ts "app/(shop)/track/page.tsx"
git commit -m "feat(shipment): surface arrival status on public track page"
```

---

## Spec Coverage Checklist

- [x] `arrivedAtPort` / `arrivedAtWarehouse` timestamp columns on `containers` (Task 1)
- [x] `notifiedPortArrived` / `notifiedWarehouseArrived` boolean flags on subscribers (Task 1)
- [x] `markContainerArrived(id, milestone)` query function (Task 2)
- [x] `markSubscriberNotified` union extended to include new flag names (Task 2)
- [x] `getContainersWithSubscriberCounts` includes arrival fields (Task 2)
- [x] `getSubscribersForContainer` includes new notification flags (Task 2)
- [x] `sendArrivalNotifications(container, milestone)` with per-subscriber try/catch (Task 3)
- [x] Port arrived email: "has arrived at Tema Port" / "being processed" (Task 3)
- [x] Warehouse arrived email: "ready at our Ghana Warehouse" / "ready for collection" (Task 3)
- [x] Skip already-notified subscribers (Task 3)
- [x] `POST /api/admin/containers/[id]/arrive` — auth, 404, fire-and-forget notifications (Task 4)
- [x] ContainerTable: "Mark arrived" link in ETA cells when ETA is set and not yet arrived (Task 5)
- [x] ContainerTable: green "✓ Arrived [date]" badge when arrived (Task 5)
- [x] ContainerTable: hidden when ETA not set (Task 5)
- [x] Admin page wires `onArrivalMarked={loadContainers}` (Task 5)
- [x] Admin page date conversion includes `arrivedAtPort` / `arrivedAtWarehouse` (Task 5)
- [x] `GET /api/track` response includes `arrivedAtPort` / `arrivedAtWarehouse` (Task 6)
- [x] Public track page shows "✓ Arrived [date]" in green when arrived (Task 6)
- [x] Public track page shows ETA as before when not arrived (Task 6)
