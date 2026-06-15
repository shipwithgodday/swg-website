# Arrival Milestone Notifications — Design Spec

**Date:** 2026-05-29
**Feature:** Manual arrival confirmation with customer email notifications
**Builds on:** Shipment tracking feature (containers, ETA management, subscriber notifications)

---

## Overview

Admins manually mark containers as "arrived at Tema Port" or "arrived at Ghana Warehouse". Each action fires a one-time arrival confirmation email to all subscribers for that container — separate from the existing ETA heads-up emails.

A customer can receive up to 4 emails per shipment:
1. ETA for Tema Port (existing — sent when admin sets/updates date)
2. **Arrived at Tema Port** (new — sent when admin marks arrived)
3. ETA for Ghana Warehouse (existing)
4. **Ready at Ghana Warehouse** (new)

---

## Schema Changes

### `containers` table — two new nullable timestamp columns

```ts
arrivedAtPort: timestamp('arrived_at_port', { withTimezone: true })  // null until marked
arrivedAtWarehouse: timestamp('arrived_at_warehouse', { withTimezone: true })  // null until marked
```

Setting to the current timestamp serves as both the arrived flag and the arrival time record.

### `shipmentNotificationSubscribers` table — two new boolean flags

```ts
notifiedPortArrived: boolean('notified_port_arrived').notNull().default(false)
notifiedWarehouseArrived: boolean('notified_warehouse_arrived').notNull().default(false)
```

These are independent of the existing `notifiedPortArrival` / `notifiedWarehouseArrival` ETA flags. A subscriber row will have four notification flags total.

---

## API

### `POST /api/admin/containers/[id]/arrive`

**Auth:** `isAdmin()` — 401 if not admin

**Body:**
```json
{ "milestone": "port" | "warehouse" }
```

**Logic:**
1. Load container by id — 404 if not found
2. If milestone already marked (arrivedAtPort/arrivedAtWarehouse is not null) — return 409 `{ error: 'Already marked as arrived' }`
3. Set `arrivedAtPort` or `arrivedAtWarehouse` to `new Date()` via new query function `markContainerArrived(id, milestone)`
4. Fire-and-forget `sendArrivalNotifications(updatedContainer, milestone)`
5. Return updated container

---

## Query Layer (`lib/shipment/queries.ts`)

### Extend: `markSubscriberNotified`

The existing function signature:
```ts
field: 'notifiedPortArrival' | 'notifiedWarehouseArrival'
```
Extend the union to include the two new flags:
```ts
field: 'notifiedPortArrival' | 'notifiedWarehouseArrival' | 'notifiedPortArrived' | 'notifiedWarehouseArrived'
```

### New function: `markContainerArrived`

```ts
export async function markContainerArrived(
  id: string,
  milestone: 'port' | 'warehouse'
): Promise<Container>
```

Sets `arrivedAtPort` or `arrivedAtWarehouse` to `new Date()` and returns the updated row. Throws if container not found.

---

## Notifications (`lib/shipment/notifications.ts`)

### New function: `sendArrivalNotifications`

```ts
export async function sendArrivalNotifications(
  container: Container,
  milestone: 'port' | 'warehouse'
): Promise<void>
```

**Logic:**
- Guard: return early if `RESEND_API_KEY` not set (warn)
- Fetch all subscribers for the container
- For each subscriber:
  - Resolve email: `emailOverride ?? customerEmail` — skip with warning if neither
  - Skip if already notified (`notifiedPortArrived` or `notifiedWarehouseArrived` is true)
  - Send email inside try/catch — one failure does not block others
  - On successful send: mark `notifiedPortArrived` / `notifiedWarehouseArrived = true`

### Email templates

**Port arrival:**
- Subject: `Your shipment [INVOICE] has arrived at Tema Port`
- Body: greeting, "has arrived and is being processed", CTA link to `/track?invoice=[INVOICE]`, footer

**Warehouse arrival:**
- Subject: `Your shipment [INVOICE] is ready at our Ghana Warehouse`
- Body: greeting, "is ready for collection", CTA link, footer

No reschedule logic — arrival is a one-time event. The 409 guard on the API prevents double-sending at the route level; the `notified*Arrived` flag prevents it at the notification level.

---

## Admin UI (`components/admin/ContainerTable.tsx`)

Each container row gets arrival action chips alongside the existing "Edit ETAs" button.

**Visibility rules per milestone (port and warehouse independently):**
- ETA not set → chip hidden (no point marking arrived with no ETA)
- ETA set, not yet arrived → **"Mark Arrived"** button with ship/warehouse icon
- Arrived → green **"Arrived [d MMM yyyy]"** badge, no button

**Interaction:**
- Clicking "Mark Arrived" calls `POST /api/admin/containers/[id]/arrive`
- Shows loading state on the button during the request
- On success: `toast.success`, refresh the container list
- On 409: `toast.error('Already marked as arrived')`

---

## Public Track Page (`app/(shop)/track/page.tsx`)

The result card updates to reflect actual arrival status:

- If `arrivedAtPort` is set: show **"Arrived [date]"** (green) instead of the ETA date
- If `arrivedAtPort` is null: show ETA as before ("To be confirmed" if null)
- Same logic for warehouse

The `GET /api/track` response needs two new fields: `arrivedAtPort: string | null` and `arrivedAtWarehouse: string | null` (ISO strings).

---

## Out of Scope

- Un-marking an arrival (no undo — if marked by mistake, handle manually in DB)
- Arrival notifications for walk-in lookups with no subscriber record
- Push notifications / SMS
