# Shop — Phase 3: Admin Depth — Design

**Date:** 2026-05-18
**Status:** Approved design, pending implementation plan
**Depends on:** Phase 1 (foundation), Phase 2 (orders, customers, payments)

## Context

Phases 1 and 2 deliver a fully transactional shop: customers browse, buy, and
pay; products and categories are managed in the admin area. Phase 3 builds out
the admin so the owner can **run the business** from the dashboard — manage
orders, view and reconcile customers, see sales at a glance, and manage delivery
zones.

See the Phase 1 and Phase 2 specs for locked decisions and schema. Phase 3 adds
no new tables; it adds admin UI and the server actions behind it.

## Goals (Phase 3)

1. **Orders management** — list, filter, view, and advance order status.
2. **Customers module** — list/search customers, view a customer (orders,
   shipping mark), and manually merge duplicate records.
3. **Dashboard overview** — key sales and operational metrics on `/admin`.
4. **Delivery-zone management** — CRUD for `delivery_zones`.
5. **Inventory visibility** — low-stock surfacing for the owner.

## Non-goals (Phase 3)

- Refunds / payment reversals through the admin (handled in Paystack directly).
- Discount codes, promotions, customer segmentation.
- Multi-admin roles beyond the single `admin` role from Phase 1.
- Exporting reports (can be a later addition).

## Architecture

```
app/admin/
  page.tsx                         dashboard overview (replaces Phase 1 placeholder)
  orders/page.tsx                  orders list — filter by status, search
  orders/[id]/page.tsx             order detail — items, customer, status control
  customers/page.tsx               customers list — search by name/mark/email/phone
  customers/[id]/page.tsx          customer detail — orders, mark, merge control
  settings/delivery-zones/page.tsx delivery-zone CRUD

app/actions/shop/
  admin-orders.ts                  update order status
  admin-customers.ts               merge customers, edit customer details
  delivery-zones.ts                create/update/deactivate zones

components/admin/
  StatCard, SalesSummary, RecentOrdersTable, LowStockList,
  OrdersTable, OrderStatusUpdater, OrderDetailPanel,
  CustomersTable, CustomerDetailPanel, MergeCustomerDialog,
  DeliveryZonesEditor
```

All admin pages remain behind the Clerk `role === 'admin'` gate established in
Phase 1 (middleware + server-side layout re-check).

## Orders management

- **`/admin/orders`** — a `DataTable` of orders: order number, customer name +
  shipping mark, total, status, date. Filter by `status`; search by order
  number, customer name, or shipping mark. Sorted newest first, paginated.
- **`/admin/orders/[id]`** — order detail: line items (with snapshotted
  names/prices), totals, shipping address, delivery region, Paystack reference,
  customer link, and the current status.
- **Status control** — `OrderStatusUpdater` advances an order through the
  lifecycle: `paid → processing → shipped → delivered`, with `cancelled`
  available from any pre-`delivered` state. The `admin-orders.ts` action:
  - Validates the transition (no skipping backwards; no changes after
    `delivered`).
  - `pending` orders are not manually advanced — they resolve via the Phase 2
    payment webhook.
  - Cancelling an order **does not** auto-restock in Phase 3 (kept simple;
    restocking is a manual product-stock edit if needed). This is called out
    explicitly so the behaviour is intentional, not accidental.
  - Optionally notifies the customer by email on `shipped` (reuses the Phase 2
    email infra) — included if low-effort, otherwise deferred.

## Customers module

- **`/admin/customers`** — a `DataTable`: shipping mark, name, email, phone,
  order count, `source` (`import` / `system`). Search across name, mark, email,
  phone. This is where the owner looks up the imported 347 customers.
- **`/admin/customers/[id]`** — customer detail: contact info, shipping mark,
  account-linked status (`clerk_user_id` present or not), and their order
  history. Admin can edit name/email/phone.
- **Merge** — `MergeCustomerDialog` handles duplicates that arise when Phase 2's
  matching fails (e.g. a returning customer who used a different email got a new
  mark). Merging:
  - Picks a **surviving** record and a **merged-away** record.
  - Re-points the merged record's `orders` to the survivor.
  - Keeps the survivor's shipping mark; the merged-away mark is retired
    (the row is deleted or flagged inactive — implementation plan to decide,
    deletion preferred for cleanliness since orders are re-pointed).
  - Runs in a transaction.
- The merge UI guards against merging two account-linked (`clerk_user_id`)
  records into one, since a Clerk user maps to exactly one customer.

## Dashboard overview (`/admin`)

Replaces the Phase 1 placeholder with `StatCard`s and summary panels:

- **Sales** — total revenue and order count for today / last 7 days / last 30
  days (counting `paid` and beyond).
- **Orders needing attention** — count of `paid` orders not yet `shipped`.
- **Recent orders** — `RecentOrdersTable`, last ~10 orders with quick links.
- **Low stock** — `LowStockList` of variants at or below a low-stock threshold.
- **Customers** — total customer count.

Metrics are computed with Drizzle aggregate queries in Server Components. A
fixed low-stock threshold (e.g. ≤ 5) is used in Phase 3; making it configurable
is out of scope.

## Delivery-zone management

- **`/admin/settings/delivery-zones`** — `DeliveryZonesEditor`: list zones with
  region name, fee, active flag; create, edit fee/name, and
  activate/deactivate. Deactivating a zone hides it from Phase 2 checkout but
  preserves it on historical orders.
- Backed by `delivery-zones.ts` server actions with zod-validated input.

## Inventory visibility

- The dashboard `LowStockList` surfaces variants running low.
- The Phase 1 product list/edit pages already show and edit stock; Phase 3 adds
  no separate inventory screen — low-stock surfacing is the only new piece.

## Error handling

- Server actions return typed result objects; admin forms surface errors via the
  shadcn `alert` component (consistent with Phase 1).
- Invalid order status transitions are rejected with a clear message.
- Merge conflicts (e.g. two account-linked records) are blocked before the
  transaction runs, with an explanatory message.
- Aggregate-query failures on the dashboard degrade gracefully — a failing
  `StatCard` shows an error state rather than breaking the whole page.

## Testing

- Unit tests:
  - Order status transition validation (allowed/blocked transitions).
  - Customer merge logic — order re-pointing, mark retention, the
    account-linked guard.
  - Dashboard metric aggregations against known fixture data.
- Integration: a merge against a scratch DB asserting orders move and the
  merged-away record is removed.

## Environment variables

None new.

## New dependencies

None expected (uses Drizzle + shadcn components already in the project).

## Open questions

None blocking. Cancelled-order restocking and a configurable low-stock
threshold are intentionally deferred and can be revisited after the owner uses
the dashboard.
