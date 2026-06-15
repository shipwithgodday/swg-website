# Shop Phase 3 — Admin Depth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build out the admin so the owner can run the business — manage orders and their status, view and merge customers, see sales at a glance, and manage delivery zones. Also fix the Phase 1 variant-update behaviour now that `order_items` reference variants.

**Architecture:** New admin pages under `app/admin/` (orders, customers, settings, and a real dashboard), backed by Server Actions in `app/actions/shop/` and read helpers in `lib/shop/`. All pages stay behind the Phase 1 Clerk `role === 'admin'` gate. Atomic writes use `db.batch()` / guarded statements (the `neon-http` driver has no `db.transaction()`).

**Tech Stack:** Next.js 15 App Router, React 19, Drizzle ORM (neon-http), Clerk, shadcn/ui, zod, Jest.

**Spec:** `docs/superpowers/specs/2026-05-18-shop-phase-3-admin-depth-design.md`
**Builds on:** Phases 1 & 2. All tables already exist. `OrderStatusBadge` and `OrderSummary` components exist from Phase 2.

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/shop/order-status.ts` | Allowed order status transitions (pure) |
| `lib/shop/admin-orders.ts` | Order read helpers for admin |
| `lib/shop/admin-customers.ts` | Customer read helpers for admin |
| `lib/shop/admin-dashboard.ts` | Dashboard metric queries |
| `app/actions/shop/admin-orders.ts` | `updateOrderStatus` action |
| `app/actions/shop/admin-customers.ts` | `updateCustomer`, `mergeCustomers` actions |
| `app/actions/shop/delivery-zones.ts` | Delivery-zone CRUD actions |
| `app/admin/page.tsx` | (replace) dashboard overview |
| `app/admin/orders/page.tsx` | Orders list + status filter |
| `app/admin/orders/[id]/page.tsx` | Order detail + status control |
| `app/admin/customers/page.tsx` | Customers list + search |
| `app/admin/customers/[id]/page.tsx` | Customer detail + merge |
| `app/admin/settings/delivery-zones/page.tsx` | Delivery-zone management |
| `components/admin/AdminSidebar.tsx` | (modify) add Orders / Customers / Settings links |
| `components/admin/StatCard.tsx` | Dashboard metric card |
| `components/admin/OrderStatusUpdater.tsx` | Order status control |
| `components/admin/CustomerEditForm.tsx` | Edit a customer's contact details |
| `components/admin/MergeCustomerDialog.tsx` | Merge-customer UI |
| `components/admin/DeliveryZonesEditor.tsx` | Delivery-zone CRUD UI |
| `app/actions/shop/products.ts` | (modify) variant upsert instead of delete+reinsert |
| `components/admin/VariantEditor.tsx` | (modify) carry a variant id per row |
| `components/admin/ProductForm.tsx` | (modify) pass variant ids through |

---

## Task 1: Order status transitions (TDD)

**Files:**
- Create: `lib/shop/order-status.ts`
- Test: `lib/shop/order-status.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/shop/order-status.test.ts`:

```ts
import { canTransition, nextStatuses } from './order-status';

describe('canTransition', () => {
  it('allows the forward lifecycle steps', () => {
    expect(canTransition('paid', 'processing')).toBe(true);
    expect(canTransition('processing', 'shipped')).toBe(true);
    expect(canTransition('shipped', 'delivered')).toBe(true);
  });
  it('allows cancelling any pre-delivered order', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
    expect(canTransition('paid', 'cancelled')).toBe(true);
    expect(canTransition('shipped', 'cancelled')).toBe(true);
  });
  it('forbids cancelling or changing a delivered order', () => {
    expect(canTransition('delivered', 'cancelled')).toBe(false);
    expect(canTransition('delivered', 'shipped')).toBe(false);
  });
  it('forbids skipping steps and going backwards', () => {
    expect(canTransition('paid', 'shipped')).toBe(false);
    expect(canTransition('shipped', 'processing')).toBe(false);
  });
  it('forbids manually advancing a pending order (webhook does that)', () => {
    expect(canTransition('pending', 'paid')).toBe(false);
  });
  it('forbids a no-op transition', () => {
    expect(canTransition('paid', 'paid')).toBe(false);
  });
});

describe('nextStatuses', () => {
  it('offers processing and cancelled from paid', () => {
    expect(nextStatuses('paid').sort()).toEqual(
      ['cancelled', 'processing'].sort()
    );
  });
  it('offers nothing from delivered', () => {
    expect(nextStatuses('delivered')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/order-status.test.ts`
Expected: FAIL — cannot find module `./order-status`.

- [ ] **Step 3: Implement `lib/shop/order-status.ts`**

```ts
export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// The single forward step allowed from each status.
const FORWARD: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};

// Statuses from which an admin may cancel.
const CANCELLABLE: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
];

/** True if an admin may move an order from `from` to `to`. */
export function canTransition(from: string, to: string): boolean {
  if (from === to) return false;
  if (to === 'cancelled') return CANCELLABLE.includes(from as OrderStatus);
  return FORWARD[from as OrderStatus] === to;
}

/** The statuses an admin may move an order to from `from`. */
export function nextStatuses(from: string): OrderStatus[] {
  const out: OrderStatus[] = [];
  const forward = FORWARD[from as OrderStatus];
  if (forward) out.push(forward);
  if (CANCELLABLE.includes(from as OrderStatus)) out.push('cancelled');
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/order-status.test.ts`
Expected: PASS — all cases.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/order-status.ts lib/shop/order-status.test.ts
git commit -m "feat: add order status transition rules"
```

---

## Task 2: Admin order queries + status action

**Files:**
- Create: `lib/shop/admin-orders.ts`
- Create: `app/actions/shop/admin-orders.ts`

- [ ] **Step 1: Create `lib/shop/admin-orders.ts`**

```ts
import { cache } from 'react';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';

export interface AdminOrderFilter {
  status?: string;
  search?: string;
}

/** Orders for the admin list, with customer name + shipping mark. */
export async function listOrders(filter: AdminOrderFilter = {}) {
  const conditions = [];
  if (filter.status) {
    conditions.push(eq(orders.status, filter.status));
  }
  if (filter.search) {
    const term = `%${filter.search}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, term),
        ilike(customers.name, term),
        ilike(customers.shippingMark, term)
      )
    );
  }
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      customerName: customers.name,
      shippingMark: customers.shippingMark,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt));
}

/** A single order with its items and customer, by order id. */
export const getAdminOrder = cache(async (id: string) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id));
  if (!order) return null;
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId));
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id));
  return { order, customer: customer ?? null, items };
});
```

- [ ] **Step 2: Create `app/actions/shop/admin-orders.ts`**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { canTransition } from '@/lib/shop/order-status';
import type { ActionResult } from './categories';

export async function updateOrderStatus(
  orderId: string,
  newStatus: string
): Promise<ActionResult> {
  await requireAdmin();
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return { ok: false, error: 'Order not found.' };

  if (!canTransition(order.status, newStatus)) {
    return {
      ok: false,
      error: `Cannot change an order from "${order.status}" to "${newStatus}".`,
    };
  }

  await db
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
```

> Note: `updateOrderStatus` deliberately does NOT restock a cancelled order
> (a documented Phase 3 non-goal). It also does not send email on `shipped`.

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add lib/shop/admin-orders.ts app/actions/shop/admin-orders.ts
git commit -m "feat: add admin order queries and status action"
```

---

## Task 3: Admin orders list page + sidebar links

**Files:**
- Modify: `components/admin/AdminSidebar.tsx`
- Create: `app/admin/orders/page.tsx`

- [ ] **Step 1: Add Orders / Customers / Settings to the sidebar**

In `components/admin/AdminSidebar.tsx`, the `links` array currently has Dashboard, Products, Categories. Add three entries and the icons. Replace the `links` array and the lucide import line so the file's import and array become:

```tsx
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
} from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  {
    href: '/admin/settings/delivery-zones',
    label: 'Delivery zones',
    icon: Settings,
  },
];
```

Leave the rest of `AdminSidebar.tsx` (the `'use client'`, `usePathname`, the active-link logic, `aria-current`) unchanged. The Customers and Settings pages are built in later tasks; their links 404 until then — expected.

- [ ] **Step 2: Create `app/admin/orders/page.tsx`**

```tsx
import Link from 'next/link';
import { format } from 'date-fns';
import { listOrders } from '@/lib/shop/admin-orders';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { ORDER_STATUSES } from '@/lib/shop/order-status';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const rows = await listOrders({ status, search: q });

  const pill =
    'rounded-full border border-border px-3 py-1 text-sm transition-colors';

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>

      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search order #, name, or mark"
          className="h-9 w-72 rounded-md border border-input px-3 text-sm"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button className={cn(pill, 'bg-secondary')}>Search</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(pill, !status ? 'bg-primary text-black' : '')}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={cn(
              pill,
              status === s ? 'bg-primary text-black' : ''
            )}>
            {s}
          </Link>
        ))}
      </div>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Mark</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  {o.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{o.customerName ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {o.shippingMark}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(o.createdAt), 'd MMM yyyy')}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={o.status} />
              </TableCell>
              <TableCell>{formatCedis(o.total)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add components/admin/AdminSidebar.tsx app/admin/orders/page.tsx
git commit -m "feat: add admin orders list and sidebar links"
```

---

## Task 4: Admin order detail + status updater

**Files:**
- Create: `components/admin/OrderStatusUpdater.tsx`
- Create: `app/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Create `components/admin/OrderStatusUpdater.tsx`**

```tsx
'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { nextStatuses } from '@/lib/shop/order-status';
import { updateOrderStatus } from '@/app/actions/shop/admin-orders';

export function OrderStatusUpdater({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const options = nextStatuses(status);

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This order is {status}; no further changes.
      </p>
    );
  }

  function move(to: string) {
    start(async () => {
      const res = await updateOrderStatus(orderId, to);
      if (res.ok) {
        toast.success(`Order marked ${to}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((to) => (
        <Button
          key={to}
          variant={to === 'cancelled' ? 'destructive' : 'default'}
          disabled={pending}
          onClick={() => move(to)}>
          Mark {to}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/admin/orders/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { getAdminOrder } from '@/lib/shop/admin-orders';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminOrder(id);
  if (!data) notFound();
  const { order, customer, items } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Order {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        Placed {format(new Date(order.createdAt), 'd MMM yyyy, HH:mm')}
        {order.paystackReference &&
          ` · Paystack ref ${order.paystackReference}`}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <OrderSummary order={order} items={items} />
          <div>
            <h2 className="mb-2 text-sm font-medium">Update status</h2>
            <OrderStatusUpdater
              orderId={order.id}
              status={order.status}
            />
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium">Customer</p>
            {customer ? (
              <p className="text-muted-foreground">
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="text-primary hover:underline">
                  {customer.name ?? customer.shippingMark}
                </Link>
                <br />
                Mark: {customer.shippingMark}
                <br />
                {customer.email ?? '—'}
                <br />
                {customer.phone ?? '—'}
              </p>
            ) : (
              <p className="text-muted-foreground">Unknown</p>
            )}
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium">Delivery</p>
            <p className="text-muted-foreground">
              {order.shipName}
              <br />
              {order.shipAddress}, {order.shipCity}
              <br />
              {order.shipRegion}
              <br />
              {order.shipPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add components/admin/OrderStatusUpdater.tsx "app/admin/orders/[id]/page.tsx"
git commit -m "feat: add admin order detail page"
```

---

## Task 5: Admin customer queries + actions

**Files:**
- Create: `lib/shop/admin-customers.ts`
- Modify: `lib/shop/validation.ts` (+ `lib/shop/validation.test.ts`)
- Create: `app/actions/shop/admin-customers.ts`

- [ ] **Step 1: Add a failing test for the customer-edit schema**

Append to `lib/shop/validation.test.ts` (keep existing tests; merge the import):

```ts
import { customerEditSchema } from './validation';

describe('customerEditSchema', () => {
  it('accepts valid edits', () => {
    expect(
      customerEditSchema.safeParse({
        name: 'Ama',
        email: 'ama@example.com',
        phone: '0241234567',
      }).success
    ).toBe(true);
  });
  it('accepts null fields', () => {
    expect(
      customerEditSchema.safeParse({
        name: null,
        email: null,
        phone: null,
      }).success
    ).toBe(true);
  });
  it('rejects a malformed email', () => {
    expect(
      customerEditSchema.safeParse({ email: 'not-an-email' }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: FAIL — `customerEditSchema` is not exported.

- [ ] **Step 3: Add the schema to `lib/shop/validation.ts`**

Append:

```ts
export const customerEditSchema = z.object({
  name: z.string().trim().min(1).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().min(1).optional().nullable(),
});

export type CustomerEditInput = z.infer<typeof customerEditSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: PASS — all suites.

- [ ] **Step 5: Create `lib/shop/admin-customers.ts`**

```ts
import { cache } from 'react';
import { and, desc, eq, ilike, or, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';

/** Customers for the admin list, with order counts, optional search. */
export async function listCustomers(search?: string) {
  const where = search
    ? or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.shippingMark, `%${search}%`),
        ilike(customers.email, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      )
    : undefined;

  const rows = await db
    .select({
      id: customers.id,
      shippingMark: customers.shippingMark,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      source: customers.source,
      orderCount: count(orders.id),
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .where(where)
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt));
  return rows;
}

/** A customer with their orders, by id. */
export const getAdminCustomer = cache(async (id: string) => {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  if (!customer) return null;
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt));
  return { customer, orders: customerOrders };
});

/** All customers except `excludeId` — merge-target candidates. */
export async function listMergeCandidates(excludeId: string) {
  return db
    .select({
      id: customers.id,
      shippingMark: customers.shippingMark,
      name: customers.name,
      clerkUserId: customers.clerkUserId,
    })
    .from(customers)
    .where(and(eq(customers.id, customers.id)))
    .orderBy(desc(customers.createdAt))
    .then((rows) => rows.filter((r) => r.id !== excludeId));
}
```

- [ ] **Step 6: Create `app/actions/shop/admin-customers.ts`**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, orders } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { customerEditSchema } from '@/lib/shop/validation';
import type { ActionResult } from './categories';

export async function updateCustomer(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = customerEditSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, email, phone } = parsed.data;
  await db
    .update(customers)
    .set({
      name: name ?? null,
      email: email ?? null,
      phone: phone ?? null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id));
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath('/admin/customers');
  return { ok: true };
}

/**
 * Merges `mergedId` into `survivorId`: re-points the merged customer's
 * orders to the survivor, then deletes the merged customer. The survivor
 * keeps its shipping mark. Blocked if both records are account-linked.
 */
export async function mergeCustomers(
  survivorId: string,
  mergedId: string
): Promise<ActionResult> {
  await requireAdmin();
  if (survivorId === mergedId) {
    return { ok: false, error: 'Pick two different customers.' };
  }

  const [survivor] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, survivorId));
  const [merged] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, mergedId));
  if (!survivor || !merged) {
    return { ok: false, error: 'Customer not found.' };
  }
  if (survivor.clerkUserId && merged.clerkUserId) {
    return {
      ok: false,
      error:
        'Both customers have linked accounts and cannot be merged.',
    };
  }

  await db.batch([
    db
      .update(orders)
      .set({ customerId: survivorId })
      .where(eq(orders.customerId, mergedId)),
    db.delete(customers).where(eq(customers.id, mergedId)),
  ]);

  revalidatePath('/admin/customers');
  revalidatePath(`/admin/customers/${survivorId}`);
  return { ok: true };
}
```

- [ ] **Step 7: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add lib/shop/admin-customers.ts lib/shop/validation.ts lib/shop/validation.test.ts app/actions/shop/admin-customers.ts
git commit -m "feat: add admin customer queries and actions"
```

---

## Task 6: Admin customers list page

**Files:**
- Create: `app/admin/customers/page.tsx`

- [ ] **Step 1: Create the customers list page**

```tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { listCustomers } from '@/lib/shop/admin-customers';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rows = await listCustomers(q);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Customers</h1>

      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search name, mark, email, or phone"
          className="h-9 w-80 rounded-md border border-input px-3 text-sm"
        />
        <button
          className={cn(
            'rounded-full border border-border bg-secondary px-3 py-1 text-sm'
          )}>
          Search
        </button>
      </form>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Mark</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  {c.shippingMark}
                </Link>
              </TableCell>
              <TableCell>{c.name ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {c.email ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {c.phone ?? '—'}
              </TableCell>
              <TableCell>{c.orderCount}</TableCell>
              <TableCell>
                <Badge variant="secondary">{c.source}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                No customers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add app/admin/customers/page.tsx
git commit -m "feat: add admin customers list"
```

---

## Task 7: Admin customer detail + merge dialog

**Files:**
- Create: `components/admin/CustomerEditForm.tsx`
- Create: `components/admin/MergeCustomerDialog.tsx`
- Create: `app/admin/customers/[id]/page.tsx`

- [ ] **Step 1: Create `components/admin/CustomerEditForm.tsx`**

```tsx
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCustomer } from '@/app/actions/shop/admin-customers';

interface Props {
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

export function CustomerEditForm({ customer }: Props) {
  const router = useRouter();
  const [name, setName] = useState(customer.name ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateCustomer(customer.id, {
        name: name || null,
        email: email || null,
        phone: phone || null,
      });
      if (res.ok) {
        toast.success('Customer updated');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="c-name">Name</Label>
        <Input
          id="c-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-email">Email</Label>
        <Input
          id="c-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-phone">Phone</Label>
        <Input
          id="c-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create `components/admin/MergeCustomerDialog.tsx`**

```tsx
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { mergeCustomers } from '@/app/actions/shop/admin-customers';

interface Candidate {
  id: string;
  shippingMark: string;
  name: string | null;
}

/**
 * Merges another customer INTO this one (this customer survives, keeps
 * its shipping mark; the other's orders move here and the other is
 * deleted).
 */
export function MergeCustomerDialog({
  survivorId,
  survivorMark,
  candidates,
}: {
  survivorId: string;
  survivorMark: string;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mergedId, setMergedId] = useState('');
  const [pending, start] = useTransition();

  function doMerge() {
    if (!mergedId) return;
    start(async () => {
      const res = await mergeCustomers(survivorId, mergedId);
      if (res.ok) {
        toast.success('Customers merged');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Merge another customer in</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge into {survivorMark}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          The selected customer&apos;s orders move to {survivorMark} and
          that customer record is deleted. This cannot be undone.
        </p>
        <select
          value={mergedId}
          onChange={(e) => setMergedId(e.target.value)}
          className="h-9 w-full rounded-md border border-input px-2 text-sm">
          <option value="">Select a customer to merge in…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shippingMark} — {c.name ?? 'unnamed'}
            </option>
          ))}
        </select>
        <Button
          variant="destructive"
          disabled={pending || !mergedId}
          onClick={doMerge}>
          {pending ? 'Merging…' : 'Merge'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create `app/admin/customers/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  getAdminCustomer,
  listMergeCandidates,
} from '@/lib/shop/admin-customers';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { CustomerEditForm } from '@/components/admin/CustomerEditForm';
import { MergeCustomerDialog } from '@/components/admin/MergeCustomerDialog';

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminCustomer(id);
  if (!data) notFound();
  const { customer, orders } = data;
  const candidates = await listMergeCandidates(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {customer.name ?? customer.shippingMark}
        </h1>
        <p className="text-sm text-muted-foreground">
          Shipping mark {customer.shippingMark} ·{' '}
          {customer.clerkUserId ? 'Account linked' : 'No account'} ·{' '}
          {customer.source}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-medium">Contact details</h2>
          <CustomerEditForm
            customer={{
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            }}
          />
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-sm font-medium">Merge duplicates</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              If this customer also exists under another shipping mark,
              merge that record into this one.
            </p>
            <MergeCustomerDialog
              survivorId={customer.id}
              survivorMark={customer.shippingMark}
              candidates={candidates}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">
          Orders ({orders.length})
        </h2>
        <div className="space-y-2">
          {orders.length === 0 && (
            <p className="text-sm text-muted-foreground">No orders.</p>
          )}
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent">
              <span className="font-medium">{o.orderNumber}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(o.createdAt), 'd MMM yyyy')}
              </span>
              <OrderStatusBadge status={o.status} />
              <span className="font-medium">
                {formatCedis(o.total)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add components/admin/CustomerEditForm.tsx components/admin/MergeCustomerDialog.tsx "app/admin/customers/[id]/page.tsx"
git commit -m "feat: add admin customer detail and merge"
```

---

## Task 8: Dashboard metric queries

**Files:**
- Create: `lib/shop/admin-dashboard.ts`

- [ ] **Step 1: Create `lib/shop/admin-dashboard.ts`**

```ts
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  orders,
  customers,
  products,
  productVariants,
} from '@/lib/db/schema';

// Statuses that count as real revenue.
const REVENUE_STATUSES = [
  'paid',
  'processing',
  'shipped',
  'delivered',
];

const LOW_STOCK_THRESHOLD = 5;

/** Revenue + order count since `since`. */
async function salesSince(since: Date) {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, since)
      )
    );
  return {
    revenue: Number(row?.revenue ?? 0),
    count: Number(row?.count ?? 0),
  };
}

export async function getDashboardMetrics() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [today, week, month] = await Promise.all([
    salesSince(dayAgo),
    salesSince(weekAgo),
    salesSince(monthAgo),
  ]);

  // Orders awaiting fulfilment: paid or processing.
  const [attention] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(inArray(orders.status, ['paid', 'processing']));

  const [customerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers);

  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  const lowStock = await db
    .select({
      id: productVariants.id,
      variantName: productVariants.name,
      stock: productVariants.stockQuantity,
      productName: products.name,
      productId: products.id,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD))
    .orderBy(productVariants.stockQuantity)
    .limit(10);

  return {
    today,
    week,
    month,
    ordersNeedingAttention: Number(attention?.count ?? 0),
    customerCount: Number(customerCount?.count ?? 0),
    recentOrders,
    lowStock,
  };
}
```

- [ ] **Step 2: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add lib/shop/admin-dashboard.ts
git commit -m "feat: add dashboard metric queries"
```

---

## Task 9: Dashboard overview page

**Files:**
- Create: `components/admin/StatCard.tsx`
- Modify: `app/admin/page.tsx` (replace the placeholder)

- [ ] **Step 1: Create `components/admin/StatCard.tsx`**

```tsx
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/admin/page.tsx`**

```tsx
import Link from 'next/link';
import { format } from 'date-fns';
import { getDashboardMetrics } from '@/lib/shop/admin-dashboard';
import { formatCedis } from '@/lib/shop/money';
import { StatCard } from '@/components/admin/StatCard';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';

export default async function AdminDashboardPage() {
  const m = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (24h)"
          value={formatCedis(m.today.revenue)}
          hint={`${m.today.count} orders`}
        />
        <StatCard
          label="Revenue (7d)"
          value={formatCedis(m.week.revenue)}
          hint={`${m.week.count} orders`}
        />
        <StatCard
          label="Revenue (30d)"
          value={formatCedis(m.month.revenue)}
          hint={`${m.month.count} orders`}
        />
        <StatCard
          label="Needs attention"
          value={String(m.ordersNeedingAttention)}
          hint="paid / processing orders"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium">Recent orders</h2>
          <div className="space-y-2">
            {m.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No orders yet.
              </p>
            )}
            {m.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent">
                <span className="font-medium">{o.orderNumber}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(o.createdAt), 'd MMM')}
                </span>
                <OrderStatusBadge status={o.status} />
                <span className="font-medium">
                  {formatCedis(o.total)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium">Low stock</h2>
          <div className="space-y-2">
            {m.lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing low on stock.
              </p>
            )}
            {m.lowStock.map((v) => (
              <Link
                key={v.id}
                href={`/admin/products/${v.productId}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent">
                <span>
                  {v.productName}{' '}
                  <span className="text-muted-foreground">
                    ({v.variantName})
                  </span>
                </span>
                <span className="font-medium">{v.stock} left</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {m.customerCount} customers total.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add components/admin/StatCard.tsx app/admin/page.tsx
git commit -m "feat: add admin dashboard overview"
```

---

## Task 10: Delivery-zone validation + actions

**Files:**
- Modify: `lib/shop/validation.ts` (+ test)
- Create: `app/actions/shop/delivery-zones.ts`

- [ ] **Step 1: Add a failing test for the zone schema**

Append to `lib/shop/validation.test.ts`:

```ts
import { deliveryZoneSchema } from './validation';

describe('deliveryZoneSchema', () => {
  it('accepts a valid zone', () => {
    expect(
      deliveryZoneSchema.safeParse({
        name: 'Greater Accra',
        fee: 3000,
        active: true,
      }).success
    ).toBe(true);
  });
  it('rejects a negative fee', () => {
    expect(
      deliveryZoneSchema.safeParse({
        name: 'X',
        fee: -1,
        active: true,
      }).success
    ).toBe(false);
  });
  it('rejects an empty name', () => {
    expect(
      deliveryZoneSchema.safeParse({ name: '', fee: 0, active: true })
        .success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: FAIL — `deliveryZoneSchema` not exported.

- [ ] **Step 3: Add the schema to `lib/shop/validation.ts`**

Append:

```ts
export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  fee: z.number().int().nonnegative('Fee must be 0 or more'),
  active: z.boolean(),
});

export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: PASS — all suites.

- [ ] **Step 5: Create `app/actions/shop/delivery-zones.ts`**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { deliveryZoneSchema } from '@/lib/shop/validation';
import type { ActionResult } from './categories';

const ZONES_PATH = '/admin/settings/delivery-zones';

export async function createDeliveryZone(
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = deliveryZoneSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await db.insert(deliveryZones).values(parsed.data);
  revalidatePath(ZONES_PATH);
  return { ok: true };
}

export async function updateDeliveryZone(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = deliveryZoneSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  await db
    .update(deliveryZones)
    .set(parsed.data)
    .where(eq(deliveryZones.id, id));
  revalidatePath(ZONES_PATH);
  return { ok: true };
}
```

> Note: zones are deactivated (`active: false`) rather than deleted, so
> historical orders that reference a zone keep their FK intact. There is no
> delete action.

- [ ] **Step 6: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add lib/shop/validation.ts lib/shop/validation.test.ts app/actions/shop/delivery-zones.ts
git commit -m "feat: add delivery-zone actions"
```

---

## Task 11: Delivery-zone management page

**Files:**
- Create: `components/admin/DeliveryZonesEditor.tsx`
- Create: `app/admin/settings/delivery-zones/page.tsx`

- [ ] **Step 1: Create `components/admin/DeliveryZonesEditor.tsx`**

A client component: a row per zone (name, fee in cedis, active toggle, save) plus an add-zone row.

```tsx
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  createDeliveryZone,
  updateDeliveryZone,
} from '@/app/actions/shop/delivery-zones';

interface Zone {
  id: string;
  name: string;
  fee: number; // pesewas
  active: boolean;
}

function ZoneRow({ zone }: { zone?: Zone }) {
  const router = useRouter();
  const [name, setName] = useState(zone?.name ?? '');
  const [feeCedis, setFeeCedis] = useState(
    zone ? (zone.fee / 100).toFixed(2) : ''
  );
  const [active, setActive] = useState(zone?.active ?? true);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const payload = {
        name,
        fee: Math.round(parseFloat(feeCedis || '0') * 100),
        active,
      };
      const res = zone
        ? await updateDeliveryZone(zone.id, payload)
        : await createDeliveryZone(payload);
      if (res.ok) {
        toast.success(zone ? 'Zone updated' : 'Zone added');
        if (!zone) {
          setName('');
          setFeeCedis('');
          setActive(true);
        }
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid grid-cols-[1fr_8rem_5rem_auto] items-center gap-3 rounded-md border border-border p-3">
      <Input
        value={name}
        placeholder="Region name"
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="number"
        min="0"
        step="0.01"
        value={feeCedis}
        placeholder="Fee (GHS)"
        onChange={(e) => setFeeCedis(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={active}
          onCheckedChange={(c) => setActive(c === true)}
        />
        Active
      </label>
      <Button size="sm" disabled={pending || !name} onClick={save}>
        {pending ? '…' : zone ? 'Save' : 'Add'}
      </Button>
    </div>
  );
}

export function DeliveryZonesEditor({ zones }: { zones: Zone[] }) {
  return (
    <div className="space-y-3">
      {zones.map((z) => (
        <ZoneRow key={z.id} zone={z} />
      ))}
      <div>
        <p className="mb-2 mt-6 text-sm font-medium">Add a zone</p>
        <ZoneRow />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/admin/settings/delivery-zones/page.tsx`**

```tsx
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { DeliveryZonesEditor } from '@/components/admin/DeliveryZonesEditor';

export default async function DeliveryZonesPage() {
  const zones = await db
    .select()
    .from(deliveryZones)
    .orderBy(asc(deliveryZones.name));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Delivery zones</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fees customers pay by region. Deactivate a zone to hide it from
        checkout without affecting past orders.
      </p>
      <div className="mt-6 max-w-2xl">
        <DeliveryZonesEditor
          zones={zones.map((z) => ({
            id: z.id,
            name: z.name,
            fee: z.fee,
            active: z.active,
          }))}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add components/admin/DeliveryZonesEditor.tsx app/admin/settings/delivery-zones/page.tsx
git commit -m "feat: add delivery-zone management page"
```

---

## Task 12: Fix product variant update + final verification

The Phase 1 `updateProduct` deletes all of a product's variants and re-inserts
them, which changes variant ids. Now that `order_items.variantId` is a real FK
to `product_variants`, deleting a variant that has order items will fail the FK
constraint (or, worse, the product becomes uneditable). This task makes variant
updates id-preserving.

**Files:**
- Modify: `components/admin/VariantEditor.tsx`
- Modify: `components/admin/ProductForm.tsx`
- Modify: `app/actions/shop/products.ts`
- Modify: `lib/shop/validation.ts`

- [ ] **Step 1: Carry a variant id through `VariantRow`**

In `components/admin/VariantEditor.tsx`, add an optional `id` to the
`VariantRow` interface and `emptyVariant`:

```tsx
export interface VariantRow {
  id?: string;
  name: string;
  sku: string;
  priceCedis: string;
  stockQuantity: string;
}

export const emptyVariant: VariantRow = {
  name: '',
  sku: '',
  priceCedis: '',
  stockQuantity: '0',
};
```

No other change to `VariantEditor.tsx` — the `id` simply rides along on each
row object (the editor never displays or edits it).

- [ ] **Step 2: Pass variant ids through `ProductForm`**

In `components/admin/ProductForm.tsx`, the edit page already maps DB variants
into `VariantRow`s. Update the variant mapping in the `submit` handler's
`payload` to include the id, and ensure the edit page passes `id`. In
`ProductForm.tsx`, change the `variants` mapping inside `submit` from:

```tsx
      variants: variants.map((v) => ({
        name: v.name,
        sku: v.sku || null,
        price: Math.round(parseFloat(v.priceCedis || '0') * 100),
        stockQuantity: parseInt(v.stockQuantity || '0', 10),
      })),
```

to:

```tsx
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku || null,
        price: Math.round(parseFloat(v.priceCedis || '0') * 100),
        stockQuantity: parseInt(v.stockQuantity || '0', 10),
      })),
```

- [ ] **Step 3: Have the edit page supply each variant's id**

In `app/admin/products/[id]/page.tsx`, the `product.variants.map(...)` that
builds the `VariantRow[]` for `ProductForm` must include `id: v.id`:

```tsx
          variants: product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku ?? '',
            priceCedis: (v.price / 100).toFixed(2),
            stockQuantity: String(v.stockQuantity),
          })),
```

- [ ] **Step 4: Accept an optional variant id in the schema**

In `lib/shop/validation.ts`, update `variantInputSchema` to accept an optional
`id`:

```ts
export const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Variant name is required'),
  sku: z.string().trim().optional().nullable(),
  price: z.number().int().nonnegative('Price must be 0 or more'),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  stockQuantity: z.number().int().nonnegative('Stock must be 0 or more'),
});
```

- [ ] **Step 5: Make `updateProduct` upsert variants by id**

In `app/actions/shop/products.ts`, replace the body of `updateProduct` so it
no longer blindly deletes all variants. The new strategy:
- variants submitted **with** an `id` → UPDATE that row;
- variants submitted **without** an `id` → INSERT;
- existing variant rows **not** in the submitted set → DELETE, but only those
  with **no** `order_items` referencing them (a variant that has been ordered
  is kept so order history stays intact).

Replace the entire `updateProduct` function with:

```ts
export async function updateProduct(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const p = parsed.data;

  try {
    // Existing variants for this product.
    const existing = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, id));
    const existingIds = new Set(existing.map((v) => v.id));
    const submittedIds = new Set(
      p.variants.map((v) => v.id).filter((v): v is string => !!v)
    );

    // Variants removed in the form.
    const removed = [...existingIds].filter(
      (vid) => !submittedIds.has(vid)
    );
    // Of those, which are safe to delete (no order_items reference them).
    let deletable: string[] = [];
    if (removed.length) {
      const referenced = await db
        .select({ variantId: orderItems.variantId })
        .from(orderItems)
        .where(inArray(orderItems.variantId, removed));
      const referencedIds = new Set(
        referenced.map((r) => r.variantId)
      );
      deletable = removed.filter((vid) => !referencedIds.has(vid));
    }

    const statements = [];

    // Product row.
    statements.push(
      db
        .update(products)
        .set({
          name: p.name,
          slug: slugify(p.name),
          description: p.description ?? null,
          categoryId: p.categoryId ?? null,
          status: p.status,
          featured: p.featured,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
    );

    // Delete only the safely-removable variants.
    for (const vid of deletable) {
      statements.push(
        db.delete(productVariants).where(eq(productVariants.id, vid))
      );
    }

    // Upsert submitted variants.
    p.variants.forEach((v, i) => {
      if (v.id && existingIds.has(v.id)) {
        statements.push(
          db
            .update(productVariants)
            .set({
              name: v.name,
              sku: v.sku ?? null,
              price: v.price,
              compareAtPrice: v.compareAtPrice ?? null,
              stockQuantity: v.stockQuantity,
              position: i,
            })
            .where(eq(productVariants.id, v.id))
        );
      } else {
        statements.push(
          db.insert(productVariants).values({
            productId: id,
            name: v.name,
            sku: v.sku ?? null,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            stockQuantity: v.stockQuantity,
            position: i,
          })
        );
      }
    });

    await db.batch(
      statements as [(typeof statements)[number], ...typeof statements]
    );
  } catch (error) {
    console.error('updateProduct failed', error);
    return { ok: false, error: 'Could not save the product.' };
  }

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}
```

Add `inArray` and `orderItems` to the imports at the top of
`app/actions/shop/products.ts`:
- the import from `drizzle-orm` becomes `import { eq, inArray } from 'drizzle-orm';`
- the schema import becomes `import { products, productVariants, orderItems } from '@/lib/db/schema';`

The `statements` array always has at least the product `update`, so the
`db.batch` cast to a non-empty tuple is safe.

- [ ] **Step 6: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors. If the `db.batch(statements as ...)` cast does not
satisfy Drizzle's batch typing, use this simpler approach instead: keep the
product `update` as a literal first element and spread the rest —
`await db.batch([productUpdate, ...otherStatements])` — building
`otherStatements` as a separate array. Adjust only as needed to type-check;
the runtime behaviour must stay identical.

- [ ] **Step 7: Runtime probe**

Write a throwaway `scripts/_p3_probe.ts` that verifies the variant-upsert and
the order-status / merge logic against the live DB:
- create a product with 2 variants;
- create a customer + an order + an order_item referencing variant #1;
- call the data-layer equivalent of `updateProduct`'s logic — OR more simply:
  directly test that (a) a variant with an `order_items` reference is NOT
  deletable and (b) `db.batch` of an update + insert + update works;
- exercise `canTransition('paid','processing')` etc. (import from
  `lib/shop/order-status`);
- exercise the merge `db.batch` (re-point orders, delete a customer) on test
  rows;
- clean up ALL test rows;
- log SUCCESS or the failure.

Run: `pnpm exec tsx --env-file .env.local scripts/_p3_probe.ts`. Confirm
SUCCESS. Then delete the probe (`rm scripts/_p3_probe.ts`) — do NOT commit it.
If it fails, report BLOCKED with the exact error.

- [ ] **Step 8: Full verification**

- Run `pnpm test` — all suites pass (Phases 1–2 suites + Phase 3's
  `order-status` and the new `validation` cases).
- Run `pnpm exec tsc --noEmit` — clean.
- Run `pnpm build` — webpack compiles all admin routes (`/admin`,
  `/admin/orders`, `/admin/orders/[id]`, `/admin/customers`,
  `/admin/customers/[id]`, `/admin/settings/delivery-zones`). The build still
  fails at the pre-existing `/api/send` / `/api/send-bulk` email routes — that
  is unrelated.

- [ ] **Step 9: Commit**

```bash
git add components/admin/VariantEditor.tsx components/admin/ProductForm.tsx app/actions/shop/products.ts lib/shop/validation.ts "app/admin/products/[id]/page.tsx"
git commit -m "fix: preserve variant ids on product update"
```

---

## Final verification checklist

- [ ] All test suites pass (`pnpm test`).
- [ ] `pnpm exec tsc --noEmit` clean.
- [ ] `pnpm build` compiles all admin + shop routes (email-route failure is pre-existing).
- [ ] The Task 12 probe confirmed variant-upsert safety, status transitions, and the merge batch.
- [ ] Manual (user, as a Clerk admin): dashboard shows metrics; orders list filters by status; an order's status advances `paid → processing → shipped → delivered`; customers list searches; a merge re-points orders; delivery zones can be added/edited/deactivated.

## Self-Review Notes

- **Spec coverage:** orders management (Tasks 1–4), customers module + merge
  (Tasks 5–7), dashboard (Tasks 8–9), delivery-zone management (Tasks 10–11),
  low-stock surfacing (Task 8/9). The carry-over variant-id fix is Task 12.
- **Non-goals respected:** cancelled orders are not auto-restocked; no refunds
  through the admin; the low-stock threshold is the fixed constant `5`.
- **Transaction approach:** the merge and the variant upsert use `db.batch()`;
  single-row updates use guarded `UPDATE`. No `db.transaction()`.
- **Type consistency:** `ActionResult` reused from `categories.ts`. `OrderStatus`
  from `order-status.ts`. `VariantRow` gains an optional `id` used consistently
  by `VariantEditor`, `ProductForm`, the edit page, and `variantInputSchema`.
