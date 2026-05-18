# Shop Phase 2 — Cart, Checkout & Payments — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shop transactional — a client cart, a checkout flow, Paystack payment, order records with shipping-mark assignment, customer order history, and confirmation emails.

**Architecture:** A client-side cart (React context + localStorage). Checkout is a Server Action that creates a `pending` order with server-computed totals and initializes a Paystack transaction. The Paystack webhook (an API route) is the source of truth — it verifies the HMAC signature, marks the order `paid`, and decrements stock. All atomic writes use `db.batch([...])` plus guarded `UPDATE` statements (the `neon-http` driver does not support `db.transaction()`).

**Tech Stack:** Next.js 15 App Router, React 19, Drizzle ORM (neon-http), Paystack REST API, Clerk, shadcn/ui, zod, Jest.

**Spec:** `docs/superpowers/specs/2026-05-18-shop-phase-2-checkout-payments-design.md`
**Builds on:** Phase 1 (schema, storefront, admin). The `orders`/`order_items` tables already exist from Phase 1's migration.

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `lib/shop/cart.ts` | Pure cart math (`cartSubtotal`) |
| `lib/cart-context.tsx` | Client cart provider + `useCart` hook (localStorage-backed) |
| `lib/shop/order-number.ts` | Human-readable order number generator |
| `lib/shop/paystack.ts` | Paystack init / verify / HMAC-signature helpers |
| `lib/shop/customer.ts` | Phone normalisation + customer resolution / shipping-mark allocation |
| `lib/shop/orders.ts` | Order read helpers for customer order pages |
| `lib/shop/order-email.ts` | Order confirmation email builder + sender |
| `scripts/seed-delivery-zones.ts` | One-off delivery-zone seed |
| `app/actions/shop/checkout.ts` | `createCheckout` server action |
| `app/api/webhooks/paystack/route.ts` | Paystack webhook — payment source of truth |
| `app/(shop)/layout.tsx` | (modified) wraps children in `CartProvider` |
| `app/(shop)/shop/cart/page.tsx` | Cart page |
| `app/(shop)/shop/checkout/page.tsx` | Checkout page (auth required) |
| `app/(shop)/shop/checkout/processing/page.tsx` | Post-Paystack verify + redirect |
| `app/(shop)/shop/orders/page.tsx` | Customer order history |
| `app/(shop)/shop/orders/[orderNumber]/page.tsx` | Order detail / confirmation |
| `components/shop/AddToCartButton.tsx` | Variant select + add to cart (product detail) |
| `components/shop/CartDrawer.tsx` | Slide-out cart (shadcn Sheet) |
| `components/shop/CartView.tsx` | Shared cart line-item list + summary |
| `components/shop/CheckoutForm.tsx` | Checkout form (address, region, submit) |
| `components/shop/OrderSummary.tsx` | Order line items + totals (reused on order pages) |
| `components/shop/OrderStatusBadge.tsx` | Status badge |
| `components/shared/navbar/CartLink.tsx` | Navbar cart icon with item count |
| `middleware.ts` | (modified) gate `/shop/checkout` and `/shop/orders` |

---

## Task 1: Cart math utility (TDD)

**Files:**
- Create: `lib/shop/cart.ts`
- Test: `lib/shop/cart.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/shop/cart.test.ts`:

```ts
import { cartSubtotal, type CartItem } from './cart';

const item = (price: number, quantity: number): CartItem => ({
  variantId: crypto.randomUUID(),
  productSlug: 'p',
  productName: 'P',
  variantName: 'V',
  unitPrice: price,
  imageUrl: null,
  quantity,
});

describe('cartSubtotal', () => {
  it('sums price times quantity across items', () => {
    expect(cartSubtotal([item(5000, 2), item(1500, 1)])).toBe(11500);
  });
  it('is zero for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/cart.test.ts`
Expected: FAIL — cannot find module `./cart`.

- [ ] **Step 3: Implement `lib/shop/cart.ts`**

```ts
/** A line in the client-side cart. Money fields are integer pesewas. */
export interface CartItem {
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
}

/** Sum of unitPrice * quantity across all items, in pesewas. */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/cart.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/cart.ts lib/shop/cart.test.ts
git commit -m "feat: add cart math utility"
```

---

## Task 2: Cart context provider

**Files:**
- Create: `lib/cart-context.tsx`

- [ ] **Step 1: Implement the cart provider**

`lib/cart-context.tsx` — a client context, persisted to `localStorage`, mirroring the existing `lib/booking-context.tsx` pattern.

```tsx
'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { cartSubtotal, type CartItem } from '@/lib/shop/cart';

const STORAGE_KEY = 'swg-shop-cart';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  subtotal: 0,
  addItem: () => {},
  removeItem: () => {},
  setQuantity: () => {},
  clear: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist whenever items change (after hydration).
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          return prev.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { ...item, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.reduce((n, i) => n + i.quantity, 0),
        subtotal: cartSubtotal(items),
        addItem,
        removeItem,
        setQuantity,
        clear,
      }}>
      {children}
    </CartContext.Provider>
  );
};
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors from `lib/cart-context.tsx`.

- [ ] **Step 3: Commit**

```bash
git add lib/cart-context.tsx
git commit -m "feat: add cart context provider"
```

---

## Task 3: Mount the cart provider and drawer

**Files:**
- Modify: `app/(shop)/layout.tsx`
- Create: `components/shop/CartView.tsx`
- Create: `components/shop/CartDrawer.tsx`

- [ ] **Step 1: Create `components/shop/CartView.tsx`**

A shared line-item list with quantity controls, used by both the drawer and the cart page.

```tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';
import { Button } from '@/components/ui/button';

export function CartView({ onNavigate }: { onNavigate?: () => void }) {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">Your cart is empty.</p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((i) => (
        <div key={i.variantId} className="flex gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {i.imageUrl && (
              <Image
                src={i.imageUrl}
                alt={i.productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/shop/products/${i.productSlug}`}
              onClick={onNavigate}
              className="text-sm font-medium hover:underline">
              {i.productName}
            </Link>
            <p className="text-xs text-muted-foreground">
              {i.variantName}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={i.quantity}
                onChange={(e) =>
                  setQuantity(
                    i.variantId,
                    parseInt(e.target.value || '1', 10)
                  )
                }
                className="h-8 w-16 rounded-md border border-input px-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(i.variantId)}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <p className="text-sm font-medium">
            {formatCedis(i.unitPrice * i.quantity)}
          </p>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="font-medium">Subtotal</span>
        <span className="font-medium">{formatCedis(subtotal)}</span>
      </div>
      <Button asChild className="w-full">
        <Link href="/shop/checkout" onClick={onNavigate}>
          Checkout
        </Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/shop/CartDrawer.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/lib/cart-context';
import { CartView } from './CartView';

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative inline-flex items-center">
        <ShoppingBag className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-black">
            {itemCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="w-full max-w-sm overflow-y-auto p-6">
        <SheetHeader className="px-0">
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <CartView onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

Note: if `sheet` is not present in `components/ui/`, add it: `pnpm dlx shadcn@latest add sheet`.

- [ ] **Step 3: Wrap the shop layout in `CartProvider`**

Replace `app/(shop)/layout.tsx` with:

```tsx
import { CartProvider } from '@/lib/cart-context';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(shop)/layout.tsx" components/shop/CartView.tsx components/shop/CartDrawer.tsx components/ui
git commit -m "feat: add cart provider, drawer, and cart view"
```

---

## Task 4: Cart page

**Files:**
- Create: `app/(shop)/shop/cart/page.tsx`

- [ ] **Step 1: Create the cart page**

```tsx
import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import { CartView } from '@/components/shop/CartView';

export const metadata: Metadata = { title: 'Cart' };

export default function CartPage() {
  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">Your cart</h1>
      <div className="mt-8 max-w-xl">
        <CartView />
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Verify**

Run `pnpm dev`, visit `/shop/cart` — renders the empty-cart message (cart is empty until Task 5 wires add-to-cart).

- [ ] **Step 3: Commit**

```bash
git add "app/(shop)/shop/cart/page.tsx"
git commit -m "feat: add cart page"
```

---

## Task 5: Add-to-cart on the product detail page

**Files:**
- Create: `components/shop/AddToCartButton.tsx`
- Modify: `app/(shop)/shop/products/[slug]/page.tsx`

- [ ] **Step 1: Create `components/shop/AddToCartButton.tsx`**

A client component: pick a variant, then add to cart. Replaces the static `VariantList` on the product page.

```tsx
'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatCedis } from '@/lib/shop/money';
import { useCart } from '@/lib/cart-context';

interface Variant {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
}

interface Props {
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  variants: Variant[];
}

export function AddToCartButton({
  productSlug,
  productName,
  imageUrl,
  variants,
}: Props) {
  const { addItem } = useCart();
  const firstAvailable =
    variants.find((v) => v.stockQuantity > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);

  const selected = variants.find((v) => v.id === selectedId);
  const canAdd = !!selected && selected.stockQuantity > 0;

  function add() {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productSlug,
      productName,
      variantName: selected.name,
      unitPrice: selected.price,
      imageUrl,
    });
    toast.success(`${productName} added to cart`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={v.stockQuantity === 0}
            onClick={() => setSelectedId(v.id)}
            className={cn(
              'flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-colors',
              v.id === selectedId
                ? 'border-primary bg-accent'
                : 'border-border',
              v.stockQuantity === 0 && 'opacity-50'
            )}>
            <span>
              <span className="font-medium">{v.name}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {v.stockQuantity > 0
                  ? `${v.stockQuantity} in stock`
                  : 'Out of stock'}
              </span>
            </span>
            <span className="font-medium">{formatCedis(v.price)}</span>
          </button>
        ))}
      </div>
      <Button onClick={add} disabled={!canAdd} className="w-full">
        {canAdd ? 'Add to cart' : 'Out of stock'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Use it on the product detail page**

In `app/(shop)/shop/products/[slug]/page.tsx`, replace the `VariantList` import and its usage. Change the import line `import { VariantList } from '@/components/shop/VariantList';` to:

```tsx
import { AddToCartButton } from '@/components/shop/AddToCartButton';
```

Then replace the entire `<div className="mt-6">...<VariantList .../></div>` block plus the "Online checkout is coming soon." paragraph with:

```tsx
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium">Options</h2>
            <AddToCartButton
              productSlug={product.slug}
              productName={product.name}
              imageUrl={product.images[0]?.url ?? null}
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: v.price,
                stockQuantity: v.stockQuantity,
              }))}
            />
          </div>
```

Leave the rest of the page (gallery, category, title, out-of-stock note, description) unchanged. `components/shop/VariantList.tsx` is now unused — delete it: `git rm components/shop/VariantList.tsx`.

- [ ] **Step 3: Type-check and verify**

Run: `pnpm exec tsc --noEmit` — no new errors.
Run `pnpm dev`: open a product, select a variant, add to cart — a toast appears; `/shop/cart` shows the line item; reloading the page keeps the cart (localStorage).

- [ ] **Step 4: Commit**

```bash
git add components/shop/AddToCartButton.tsx "app/(shop)/shop/products/[slug]/page.tsx" components/shop/VariantList.tsx
git commit -m "feat: add to cart from product detail page"
```

---

## Task 6: Navbar cart link

**Files:**
- Create: `components/shared/navbar/CartLink.tsx`
- Modify: `components/shared/navbar/index.tsx` (or the navbar's button row — see step 2)

- [ ] **Step 1: Create `components/shared/navbar/CartLink.tsx`**

The `CartDrawer` from Task 3 already renders a trigger with the count badge. `CartLink` simply re-exports it for navbar use, keeping navbar imports tidy.

```tsx
'use client';
import { CartDrawer } from '@/components/shop/CartDrawer';

export function CartLink() {
  return <CartDrawer />;
}
```

- [ ] **Step 2: Render `CartLink` in the navbar**

Open `components/shared/navbar/index.tsx`. Locate where the navbar renders its right-side actions (it imports `Buttons` from `./Buttons`). Add the cart next to those actions: import `CartLink` and render `<CartLink />` immediately before the `<Buttons />` element.

If `components/shared/navbar/index.tsx` does not directly render `Buttons`, instead open `components/shared/navbar/Buttons.tsx` and render `<CartLink />` as the first child of its top-level wrapper element. Import: `import { CartLink } from './CartLink';`.

The `CartProvider` only wraps `app/(shop)/` routes, but the navbar is global. To avoid `useCart` running without a provider on non-shop pages, the `CartDrawer` must tolerate being outside a provider — and it does: `useCart` returns the default context value (`itemCount: 0`) when no provider is present, so the badge simply shows nothing. No crash. Verify this holds.

- [ ] **Step 3: Type-check and verify**

Run: `pnpm exec tsc --noEmit` — no new errors.
Run `pnpm dev`: the cart icon shows in the navbar on all pages; on `/shop/*` pages it reflects the cart count and opens the drawer.

- [ ] **Step 4: Commit**

```bash
git add components/shared/navbar
git commit -m "feat: add cart link to navbar"
```

---

## Task 7: Order number generator (TDD)

**Files:**
- Create: `lib/shop/order-number.ts`
- Test: `lib/shop/order-number.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/shop/order-number.test.ts`:

```ts
import { generateOrderNumber } from './order-number';

describe('generateOrderNumber', () => {
  it('starts with the SWG- prefix', () => {
    expect(generateOrderNumber()).toMatch(/^SWG-[A-Z0-9]{8}$/);
  });
  it('produces unique values', () => {
    const seen = new Set(
      Array.from({ length: 500 }, () => generateOrderNumber())
    );
    expect(seen.size).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/order-number.test.ts`
Expected: FAIL — cannot find module `./order-number`.

- [ ] **Step 3: Implement `lib/shop/order-number.ts`**

```ts
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1

/** A human-readable, collision-resistant order number, e.g. SWG-7K2P9Qature. */
export function generateOrderNumber(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let suffix = '';
  for (const b of bytes) suffix += ALPHABET[b % ALPHABET.length];
  return `SWG-${suffix}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/order-number.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/order-number.ts lib/shop/order-number.test.ts
git commit -m "feat: add order number generator"
```

---

## Task 8: Paystack helpers (TDD for signature)

**Files:**
- Create: `lib/shop/paystack.ts`
- Test: `lib/shop/paystack.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/shop/paystack.test.ts` — the HMAC verification is the testable pure part.

```ts
import crypto from 'crypto';
import { verifyPaystackSignature } from './paystack';

describe('verifyPaystackSignature', () => {
  const secret = 'sk_test_example';
  const body = JSON.stringify({ event: 'charge.success' });
  const valid = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');

  it('accepts a correct signature', () => {
    expect(verifyPaystackSignature(body, valid, secret)).toBe(true);
  });
  it('rejects a tampered signature', () => {
    expect(verifyPaystackSignature(body, valid, secret)).toBe(true);
    expect(
      verifyPaystackSignature(body + 'x', valid, secret)
    ).toBe(false);
  });
  it('rejects an empty signature', () => {
    expect(verifyPaystackSignature(body, '', secret)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/paystack.test.ts`
Expected: FAIL — cannot find module `./paystack`.

- [ ] **Step 3: Implement `lib/shop/paystack.ts`**

```ts
import 'server-only';
import crypto from 'crypto';

const PAYSTACK_BASE = 'https://api.paystack.co';

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

export interface PaystackInit {
  authorizationUrl: string;
  reference: string;
}

/** Initializes a Paystack transaction; returns the hosted checkout URL. */
export async function initializeTransaction(input: {
  email: string;
  amount: number; // pesewas
  reference: string;
  callbackUrl: string;
}): Promise<PaystackInit> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: 'GHS',
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? 'Paystack init failed');
  }
  return {
    authorizationUrl: json.data.authorization_url as string,
    reference: json.data.reference as string,
  };
}

export interface PaystackVerification {
  status: string; // 'success' | 'failed' | 'abandoned' ...
  reference: string;
  amount: number;
}

/** Verifies a transaction by reference (callback-page fallback). */
export async function verifyTransaction(
  reference: string
): Promise<PaystackVerification> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } }
  );
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? 'Paystack verify failed');
  }
  return {
    status: json.data.status as string,
    reference: json.data.reference as string,
    amount: json.data.amount as number,
  };
}

/** Verifies the x-paystack-signature HMAC of a raw webhook body. */
export function verifyPaystackSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
```

> Note: the test imports `verifyPaystackSignature` and passes the secret
> explicitly, so it never touches `process.env` or the `server-only` import's
> runtime. `verifyPaystackSignature` is a pure function.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/paystack.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/paystack.ts lib/shop/paystack.test.ts
git commit -m "feat: add Paystack helpers"
```

---

## Task 9: Customer resolution + shipping-mark allocation (TDD)

**Files:**
- Create: `lib/shop/customer.ts`
- Test: `lib/shop/customer.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/shop/customer.test.ts` — the testable pure part is phone normalisation.

```ts
import { normalizePhone } from './customer';

describe('normalizePhone', () => {
  it('strips spaces and punctuation', () => {
    expect(normalizePhone('024 123 4567')).toBe('0241234567');
  });
  it('reduces to the last 9 significant digits for matching', () => {
    expect(normalizePhone('+233 24 123 4567')).toBe('241234567');
    expect(normalizePhone('0241234567')).toBe('241234567');
  });
  it('returns empty string for no digits', () => {
    expect(normalizePhone('WeChat')).toBe('');
  });
});
```

> `normalizePhone` returns the trailing 9 digits (Ghana subscriber number
> length) so `+233...`, `0...`, and bare forms all compare equal. If fewer
> than 9 digits are present it returns whatever digits it has.

Wait — the first test expects `'0241234567'` (10 digits) but the rule says
"last 9". Resolve this: `normalizePhone` has TWO behaviours folded wrongly.
Use a single rule: **return all digits, then if there are more than 9, keep
the last 9.** `'024 123 4567'` → digits `0241234567` (10) → last 9 →
`'241234567'`. So the first test's expected value must be `'241234567'`, not
`'0241234567'`. Write the test with the corrected expectation:

```ts
import { normalizePhone } from './customer';

describe('normalizePhone', () => {
  it('strips non-digits and keeps the last 9 digits', () => {
    expect(normalizePhone('024 123 4567')).toBe('241234567');
  });
  it('treats +233, 0-prefixed, and bare forms as equal', () => {
    expect(normalizePhone('+233 24 123 4567')).toBe('241234567');
    expect(normalizePhone('0241234567')).toBe('241234567');
    expect(normalizePhone('241234567')).toBe('241234567');
  });
  it('returns empty string when there are no digits', () => {
    expect(normalizePhone('WeChat')).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/customer.test.ts`
Expected: FAIL — cannot find module `./customer`.

- [ ] **Step 3: Implement `lib/shop/customer.ts`**

```ts
import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';

/** Reduces a raw phone string to its last 9 digits for fuzzy matching. */
export function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length > 9 ? digits.slice(-9) : digits;
}

export interface ResolveCustomerInput {
  clerkUserId: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

/**
 * Resolves the customer for an order:
 * 1. existing row by clerkUserId, else
 * 2. an imported row matched by email then phone (claimed by setting
 *    clerk_user_id), else
 * 3. a brand-new customer with the next shipping mark from the sequence.
 * Returns the customer id.
 */
export async function resolveCustomerId(
  input: ResolveCustomerInput
): Promise<string> {
  // 1. Already linked.
  const linked = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.clerkUserId, input.clerkUserId))
    .limit(1);
  if (linked[0]) return linked[0].id;

  // 2. Match an imported/offline customer with no Clerk link yet.
  const candidates = await db
    .select()
    .from(customers)
    .where(sql`${customers.clerkUserId} is null`);

  let match = input.email
    ? candidates.find(
        (c) =>
          c.email != null &&
          c.email.toLowerCase() === input.email!.toLowerCase()
      )
    : undefined;

  if (!match && input.phone) {
    const target = normalizePhone(input.phone);
    if (target) {
      match = candidates.find(
        (c) => normalizePhone(c.phone) === target
      );
    }
  }

  if (match) {
    await db
      .update(customers)
      .set({
        clerkUserId: input.clerkUserId,
        email: match.email ?? input.email,
        phone: match.phone ?? input.phone,
        name: match.name ?? input.name,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, match.id));
    return match.id;
  }

  // 3. New customer — allocate the next shipping mark.
  const seq = await db.execute(
    sql`SELECT nextval('shipping_mark_seq') AS n`
  );
  const markNo = Number((seq.rows[0] as { n: string | number }).n);
  const [created] = await db
    .insert(customers)
    .values({
      clerkUserId: input.clerkUserId,
      shippingMark: `GD${markNo}`,
      shippingMarkNo: markNo,
      email: input.email,
      phone: input.phone,
      name: input.name,
      source: 'system',
    })
    .returning({ id: customers.id });
  return created.id;
}
```

> Note on `db.execute` result shape: with the neon-http driver,
> `db.execute(sql\`...\`)` returns an object with a `rows` array. If the
> implementer finds the shape differs at runtime, adjust the access (verify
> with the probe in Task 16's verification) — the value needed is the single
> `nextval` number.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/customer.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/customer.ts lib/shop/customer.test.ts
git commit -m "feat: add customer resolution and shipping-mark allocation"
```

---

## Task 10: Delivery-zone seed

**Files:**
- Create: `scripts/seed-delivery-zones.ts`
- Modify: `package.json` (add a script)

- [ ] **Step 1: Create the seed script**

`scripts/seed-delivery-zones.ts` — idempotent: skips zones that already exist by name.

```ts
import { db } from '../lib/db';
import { deliveryZones } from '../lib/db/schema';

// Fees in pesewas (GHS minor units).
const ZONES = [
  { name: 'Greater Accra', fee: 3000 },
  { name: 'Ashanti', fee: 6000 },
  { name: 'Western', fee: 7000 },
  { name: 'Central', fee: 6000 },
  { name: 'Eastern', fee: 6000 },
  { name: 'Volta', fee: 8000 },
  { name: 'Northern', fee: 12000 },
  { name: 'Other Regions', fee: 12000 },
];

async function main() {
  const existing = await db
    .select({ name: deliveryZones.name })
    .from(deliveryZones);
  const have = new Set(existing.map((z) => z.name));
  const toInsert = ZONES.filter((z) => !have.has(z.name));
  if (toInsert.length === 0) {
    console.log('Delivery zones already seeded.');
    process.exit(0);
  }
  await db.insert(deliveryZones).values(
    toInsert.map((z) => ({ name: z.name, fee: z.fee, active: true }))
  );
  console.log(`Seeded ${toInsert.length} delivery zone(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the script to `package.json`**

Add to `scripts`:

```json
"seed:zones": "tsx --env-file .env.local scripts/seed-delivery-zones.ts"
```

- [ ] **Step 3: Run the seed**

Run: `pnpm seed:zones`
Expected: `Seeded 8 delivery zone(s).`

- [ ] **Step 4: Verify**

Run: `psql "$(grep -E '^DATABASE_URL=' .env.local | cut -d= -f2-)" -c "select name, fee from delivery_zones order by name;"`
Expected: 8 rows.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-delivery-zones.ts package.json
git commit -m "feat: add delivery-zone seed"
```

---

## Task 11: Checkout server action

**Files:**
- Create: `app/actions/shop/checkout.ts`

- [ ] **Step 1: Implement the checkout action**

`app/actions/shop/checkout.ts`. It accepts the cart's variant ids + quantities and the shipping form, recomputes everything server-side, creates a `pending` order, and initializes Paystack.

```ts
'use server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { inArray, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  productVariants,
  products,
  deliveryZones,
  orders,
  orderItems,
} from '@/lib/db/schema';
import { generateOrderNumber } from '@/lib/shop/order-number';
import { resolveCustomerId } from '@/lib/shop/customer';
import { initializeTransaction } from '@/lib/shop/paystack';

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'Your cart is empty'),
  deliveryZoneId: z.string().uuid(),
  shipName: z.string().trim().min(1, 'Name is required'),
  shipPhone: z.string().trim().min(1, 'Phone is required'),
  shipAddress: z.string().trim().min(1, 'Address is required'),
  shipCity: z.string().trim().min(1, 'City is required'),
});

export type CheckoutResult =
  | { ok: true; authorizationUrl: string }
  | { ok: false; error: string };

export async function createCheckout(
  raw: unknown
): Promise<CheckoutResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: 'Please sign in to check out.' };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const input = parsed.data;

  // Load the variants referenced by the cart, with their product.
  const variantIds = input.items.map((i) => i.variantId);
  const rows = await db
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      price: productVariants.price,
      stock: productVariants.stockQuantity,
      productName: products.name,
      productStatus: products.status,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  const byId = new Map(rows.map((r) => [r.variantId, r]));

  // Validate every cart line.
  const lineItems: {
    variantId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
  }[] = [];
  for (const item of input.items) {
    const v = byId.get(item.variantId);
    if (!v || v.productStatus !== 'active') {
      return {
        ok: false,
        error: 'An item in your cart is no longer available.',
      };
    }
    if (v.stock < item.quantity) {
      return {
        ok: false,
        error: `Not enough stock for ${v.productName} (${v.variantName}).`,
      };
    }
    lineItems.push({
      variantId: v.variantId,
      productName: v.productName,
      variantName: v.variantName,
      unitPrice: v.price,
      quantity: item.quantity,
    });
  }

  // Delivery zone.
  const [zone] = await db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.id, input.deliveryZoneId));
  if (!zone || !zone.active) {
    return { ok: false, error: 'Select a valid delivery region.' };
  }

  const subtotal = lineItems.reduce(
    (s, l) => s + l.unitPrice * l.quantity,
    0
  );
  const total = subtotal + zone.fee;

  // Resolve the customer (and allocate a shipping mark if new).
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ?? null;
  const customerId = await resolveCustomerId({
    clerkUserId: userId,
    email,
    phone: input.shipPhone,
    name: input.shipName,
  });

  if (!email) {
    return {
      ok: false,
      error: 'Your account has no email address for the receipt.',
    };
  }

  // Create the pending order + items atomically.
  const orderId = randomUUID();
  const orderNumber = generateOrderNumber();
  try {
    await db.batch([
      db.insert(orders).values({
        id: orderId,
        orderNumber,
        customerId,
        status: 'pending',
        subtotal,
        deliveryFee: zone.fee,
        total,
        deliveryZoneId: zone.id,
        shipName: input.shipName,
        shipPhone: input.shipPhone,
        shipAddress: input.shipAddress,
        shipCity: input.shipCity,
        shipRegion: zone.name,
        paystackReference: orderNumber,
      }),
      db.insert(orderItems).values(
        lineItems.map((l) => ({
          orderId,
          variantId: l.variantId,
          productName: l.productName,
          variantName: l.variantName,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        }))
      ),
    ]);
  } catch (error) {
    console.error('createCheckout: order insert failed', error);
    return { ok: false, error: 'Could not create your order.' };
  }

  // Initialize Paystack.
  try {
    const init = await initializeTransaction({
      email,
      amount: total,
      reference: orderNumber,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/shop/checkout/processing`,
    });
    return { ok: true, authorizationUrl: init.authorizationUrl };
  } catch (error) {
    console.error('createCheckout: Paystack init failed', error);
    return {
      ok: false,
      error: 'Could not start payment. Please try again.',
    };
  }
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_SITE_URL` to `.env.example`**

Append to `.env.example`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
```

The user must also set these in `.env.local` (real Paystack test keys; `NEXT_PUBLIC_SITE_URL` = the deployed URL in production).

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add app/actions/shop/checkout.ts .env.example
git commit -m "feat: add checkout server action"
```

---

## Task 12: Checkout page

**Files:**
- Create: `components/shop/CheckoutForm.tsx`
- Create: `app/(shop)/shop/checkout/page.tsx`

- [ ] **Step 1: Create `components/shop/CheckoutForm.tsx`**

```tsx
'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';
import { createCheckout } from '@/app/actions/shop/checkout';

interface Zone {
  id: string;
  name: string;
  fee: number;
}

export function CheckoutForm({ zones }: { zones: Zone[] }) {
  const { items, subtotal } = useCart();
  const [zoneId, setZoneId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pending, start] = useTransition();

  const zone = zones.find((z) => z.id === zoneId);
  const total = subtotal + (zone?.fee ?? 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    start(async () => {
      const res = await createCheckout({
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        deliveryZoneId: zoneId,
        shipName: name,
        shipPhone: phone,
        shipAddress: address,
        shipCity: city,
      });
      if (res.ok) {
        window.location.href = res.authorizationUrl;
      } else {
        toast.error(res.error);
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground">Your cart is empty.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-medium">Delivery details</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City / Town</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Delivery region</Label>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.name} — {formatCedis(z.fee)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Order summary</h2>
        {items.map((i) => (
          <div
            key={i.variantId}
            className="flex justify-between text-sm">
            <span>
              {i.productName} ({i.variantName}) × {i.quantity}
            </span>
            <span>{formatCedis(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-3 text-sm">
          <span>Subtotal</span>
          <span>{formatCedis(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span>{zone ? formatCedis(zone.fee) : '—'}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span>{formatCedis(total)}</span>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={pending || !zoneId}>
          {pending ? 'Starting payment…' : 'Pay with Paystack'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Final amount is confirmed on the secure Paystack page.
        </p>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create `app/(shop)/shop/checkout/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import Container from '@/components/shared/container';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { CheckoutForm } from '@/components/shop/CheckoutForm';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage() {
  const zones = await db
    .select({
      id: deliveryZones.id,
      name: deliveryZones.name,
      fee: deliveryZones.fee,
    })
    .from(deliveryZones)
    .where(eq(deliveryZones.active, true))
    .orderBy(asc(deliveryZones.name));

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <div className="mt-8">
        <CheckoutForm zones={zones} />
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — no new errors.

```bash
git add components/shop/CheckoutForm.tsx "app/(shop)/shop/checkout/page.tsx"
git commit -m "feat: add checkout page"
```

---

## Task 13: Paystack webhook

**Files:**
- Create: `app/api/webhooks/paystack/route.ts`

- [ ] **Step 1: Implement the webhook**

`app/api/webhooks/paystack/route.ts` — verifies the HMAC, then on `charge.success` marks the order paid and decrements stock with guarded `UPDATE`s.

```ts
import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, productVariants } from '@/lib/db/schema';
import { verifyPaystackSignature } from '@/lib/shop/paystack';
import { sendOrderConfirmationEmail } from '@/lib/shop/order-email';

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

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  // Acknowledge anything that is not a successful charge.
  if (event.event !== 'charge.success' || !event.data?.reference) {
    return NextResponse.json({ received: true });
  }

  const reference = event.data.reference;
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, reference));

  if (!order) {
    console.warn(`paystack webhook: unknown reference ${reference}`);
    return NextResponse.json({ received: true });
  }

  // Already processed — idempotent no-op.
  if (order.status !== 'pending') {
    return NextResponse.json({ received: true });
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  // Atomically: flip status (guarded so a replay updates 0 rows) and
  // decrement each variant's stock (guarded against overselling).
  await db.batch([
    db
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(
        sql`${orders.id} = ${order.id} AND ${orders.status} = 'pending'`
      ),
    ...items.map((it) =>
      db
        .update(productVariants)
        .set({
          stockQuantity: sql`${productVariants.stockQuantity} - ${it.quantity}`,
        })
        .where(
          sql`${productVariants.id} = ${it.variantId} AND ${productVariants.stockQuantity} >= ${it.quantity}`
        )
    ),
  ]);

  // Best-effort confirmation email — never blocks the webhook.
  try {
    await sendOrderConfirmationEmail(order.id);
  } catch (error) {
    console.error('paystack webhook: email send failed', error);
  }

  return NextResponse.json({ received: true });
}
```

> Note: the webhook route must read the raw body (`request.text()`) for the
> HMAC — do not use `request.json()` first. The `db.batch` argument is a
> non-empty array (the order update is always present), satisfying Drizzle's
> batch typing.

- [ ] **Step 2: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — `sendOrderConfirmationEmail` is created in Task 14; until then this file will have an unresolved import. Implement Task 14 immediately after, then type-check. If executing strictly task-by-task, expect a temporary type error here resolved by Task 14 — note it and proceed.

```bash
git add app/api/webhooks/paystack/route.ts
git commit -m "feat: add Paystack webhook"
```

---

## Task 14: Order confirmation email

**Files:**
- Create: `lib/shop/order-email.ts`

- [ ] **Step 1: Inspect the existing email infrastructure**

Read `lib/emails.ts`, `lib/mailjet.ts`, and `lib/email-template.ts` to learn the project's existing send function and its signature. The new helper must reuse whichever send primitive these expose (do not add a new email provider).

- [ ] **Step 2: Implement `lib/shop/order-email.ts`**

`lib/shop/order-email.ts` — loads the order with items + customer, builds an HTML body, and sends via the existing infrastructure. The exact send call must match what Step 1 found; the template below is the content.

```ts
import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';
import { formatCedis } from '@/lib/shop/money';
// import the existing send primitive discovered in Step 1, e.g.:
// import { sendEmail } from '@/lib/emails';

/** Builds and sends the order confirmation email. Best-effort. */
export async function sendOrderConfirmationEmail(
  orderId: string
): Promise<void> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!order) return;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId));
  if (!customer?.email) return;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const rows = items
    .map(
      (i) =>
        `<tr><td>${i.productName} (${i.variantName}) × ${i.quantity}</td>` +
        `<td style="text-align:right">${formatCedis(
          i.unitPrice * i.quantity
        )}</td></tr>`
    )
    .join('');

  const html = `
    <h2>Thank you for your order</h2>
    <p>Order <strong>${order.orderNumber}</strong></p>
    <p>Shipping mark: <strong>${customer.shippingMark}</strong></p>
    <table style="width:100%;border-collapse:collapse">
      ${rows}
      <tr><td>Subtotal</td><td style="text-align:right">${formatCedis(
        order.subtotal
      )}</td></tr>
      <tr><td>Delivery (${order.shipRegion ?? ''})</td>
          <td style="text-align:right">${formatCedis(
            order.deliveryFee
          )}</td></tr>
      <tr><td><strong>Total</strong></td>
          <td style="text-align:right"><strong>${formatCedis(
            order.total
          )}</strong></td></tr>
    </table>
    <p>Deliver to: ${order.shipName}, ${order.shipAddress}, ${
      order.shipCity
    }, ${order.shipRegion}</p>
  `;

  // Send via the existing infrastructure (signature from Step 1):
  // await sendEmail({
  //   to: customer.email,
  //   subject: `Order ${order.orderNumber} confirmed`,
  //   html,
  // });
}
```

The implementer MUST replace the commented `import` and `sendEmail` call with the actual primitive from the existing email code found in Step 1. If the existing infrastructure exposes a React-email or template-string sender, adapt the `html` accordingly. If no usable primitive exists or it cannot be called server-side without breaking, report DONE_WITH_CONCERNS describing what was found.

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors — this also resolves the Task 13 import.

- [ ] **Step 4: Commit**

```bash
git add lib/shop/order-email.ts
git commit -m "feat: add order confirmation email"
```

---

## Task 15: Order pages + processing page + order queries

**Files:**
- Create: `lib/shop/orders.ts`
- Create: `components/shop/OrderStatusBadge.tsx`
- Create: `components/shop/OrderSummary.tsx`
- Create: `app/(shop)/shop/orders/page.tsx`
- Create: `app/(shop)/shop/orders/[orderNumber]/page.tsx`
- Create: `app/(shop)/shop/checkout/processing/page.tsx`

- [ ] **Step 1: Create `lib/shop/orders.ts`**

```ts
import { cache } from 'react';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, customers } from '@/lib/db/schema';

/** The current Clerk user's customer row, or null if none yet. */
export async function getCustomerByClerkId(clerkUserId: string) {
  const [c] = await db
    .select()
    .from(customers)
    .where(eq(customers.clerkUserId, clerkUserId));
  return c ?? null;
}

/** All orders for a customer, newest first. */
export async function getOrdersForCustomer(customerId: string) {
  return db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));
}

/** A single order with its items, by order number. */
export const getOrderByNumber = cache(async (orderNumber: string) => {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber));
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  return { order, items };
});
```

- [ ] **Step 2: Create `components/shop/OrderStatusBadge.tsx`**

```tsx
import { Badge } from '@/components/ui/badge';

const LABELS: Record<string, string> = {
  pending: 'Pending payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function OrderStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'cancelled'
      ? 'destructive'
      : status === 'pending'
        ? 'secondary'
        : 'default';
  return <Badge variant={tone}>{LABELS[status] ?? status}</Badge>;
}
```

- [ ] **Step 3: Create `components/shop/OrderSummary.tsx`**

```tsx
import { formatCedis } from '@/lib/shop/money';

interface Item {
  id: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  subtotal: number;
  deliveryFee: number;
  total: number;
  shipRegion: string | null;
}

export function OrderSummary({
  order,
  items,
}: {
  order: Order;
  items: Item[];
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      {items.map((i) => (
        <div key={i.id} className="flex justify-between text-sm">
          <span>
            {i.productName} ({i.variantName}) × {i.quantity}
          </span>
          <span>{formatCedis(i.unitPrice * i.quantity)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-2 text-sm">
        <span>Subtotal</span>
        <span>{formatCedis(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Delivery {order.shipRegion ? `(${order.shipRegion})` : ''}</span>
        <span>{formatCedis(order.deliveryFee)}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-2 font-medium">
        <span>Total</span>
        <span>{formatCedis(order.total)}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `app/(shop)/shop/orders/page.tsx`**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import Container from '@/components/shared/container';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import {
  getCustomerByClerkId,
  getOrdersForCustomer,
} from '@/lib/shop/orders';

export const metadata: Metadata = { title: 'My Orders' };

export default async function OrdersPage() {
  const { userId } = await auth();
  const customer = userId ? await getCustomerByClerkId(userId) : null;
  const orders = customer
    ? await getOrdersForCustomer(customer.id)
    : [];

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">My orders</h1>
      {customer && (
        <p className="mt-1 text-sm text-muted-foreground">
          Shipping mark: <strong>{customer.shippingMark}</strong>
        </p>
      )}
      <div className="mt-8 space-y-3">
        {orders.length === 0 && (
          <p className="text-muted-foreground">No orders yet.</p>
        )}
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/shop/orders/${o.orderNumber}`}
            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent">
            <div>
              <p className="font-medium">{o.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(o.createdAt), 'd MMM yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusBadge status={o.status} />
              <span className="font-medium">
                {formatCedis(o.total)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
```

- [ ] **Step 5: Create `app/(shop)/shop/orders/[orderNumber]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Container from '@/components/shared/container';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { OrderSummary } from '@/components/shop/OrderSummary';
import {
  getOrderByNumber,
  getCustomerByClerkId,
} from '@/lib/shop/orders';

export const metadata: Metadata = { title: 'Order' };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const result = await getOrderByNumber(orderNumber);
  if (!result) notFound();
  const { order, items } = result;

  // Only the owning customer may view the order.
  const { userId } = await auth();
  const customer = userId ? await getCustomerByClerkId(userId) : null;
  if (!customer || customer.id !== order.customerId) notFound();

  return (
    <Container className="py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Order {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      {order.status === 'pending' && (
        <p className="mt-2 text-sm text-muted-foreground">
          We are still confirming your payment for this order.
        </p>
      )}
      <div className="mt-6 max-w-xl space-y-6">
        <OrderSummary order={order} items={items} />
        <div className="rounded-lg border border-border p-4 text-sm">
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
    </Container>
  );
}
```

- [ ] **Step 6: Create `app/(shop)/shop/checkout/processing/page.tsx`**

The post-Paystack landing page: verifies the transaction and redirects.

```tsx
import { redirect } from 'next/navigation';
import Container from '@/components/shared/container';
import { verifyTransaction } from '@/lib/shop/paystack';
import { getOrderByNumber } from '@/lib/shop/orders';

export const metadata = { title: 'Processing payment' };

export default async function ProcessingPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;

  if (reference) {
    try {
      const v = await verifyTransaction(reference);
      const result = await getOrderByNumber(reference);
      if (result && v.status === 'success') {
        redirect(`/shop/orders/${reference}`);
      }
    } catch {
      // fall through to the holding message
    }
  }

  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Confirming your payment…</h1>
      <p className="mt-3 text-muted-foreground">
        This can take a moment. Your order will appear under{' '}
        <a href="/shop/orders" className="text-primary underline">
          My orders
        </a>{' '}
        once payment is confirmed.
      </p>
    </Container>
  );
}
```

> Note: `redirect()` throws internally — do not wrap the `redirect` call
> itself in the try/catch. It sits after the `verifyTransaction` try/catch
> here, so it is fine.

Actually `redirect` is inside the `if (result && ...)` which is inside the
`try`. `redirect` throws a special `NEXT_REDIRECT` error that the `catch`
would swallow. Fix: move the redirect out of the try. Implement the page so
the `try` only wraps `verifyTransaction` + `getOrderByNumber`, stores a
boolean, and the `redirect` runs after the `catch`:

```tsx
  if (reference) {
    let verified = false;
    try {
      const v = await verifyTransaction(reference);
      const result = await getOrderByNumber(reference);
      verified = !!result && v.status === 'success';
    } catch {
      verified = false;
    }
    if (verified) redirect(`/shop/orders/${reference}`);
  }
```

Use this corrected form in the implementation.

- [ ] **Step 7: Type-check and verify**

Run: `pnpm exec tsc --noEmit` — no new errors.

- [ ] **Step 8: Commit**

```bash
git add lib/shop/orders.ts components/shop/OrderStatusBadge.tsx components/shop/OrderSummary.tsx "app/(shop)/shop/orders" "app/(shop)/shop/checkout/processing"
git commit -m "feat: add order pages and payment processing page"
```

---

## Task 16: Gate checkout/orders routes + final verification

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Gate `/shop/checkout` and `/shop/orders`**

In `middleware.ts`, add a matcher and a check requiring a signed-in user for those routes. Add after the existing `isAdminRoute` constant:

```ts
const isShopAuthRoute = createRouteMatcher([
  '/shop/checkout(.*)',
  '/shop/orders(.*)',
]);
```

And inside the `clerkMiddleware` callback, after the admin block, add:

```ts
  if (isShopAuthRoute(request)) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }
```

Leave the existing protected-route and admin-route logic and the `config.matcher` unchanged.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the full test suite**

Run: `pnpm test`
Expected: all suites pass — the Phase 1 suites plus Phase 2's `cart`, `order-number`, `paystack`, `customer`.

- [ ] **Step 4: Runtime probe — checkout + webhook**

Because the checkout action and webhook cannot be exercised through the UI without a Clerk session and a real Paystack redirect, verify the data-layer pieces with a throwaway probe `scripts/_p2_probe.ts` that:
- imports `db` and the schema;
- inserts a test `delivery_zone` if needed, a test product + variant (stock 5);
- directly composes the checkout `db.batch` insert (order + 1 item) with a generated order number and a `randomUUID` order id;
- runs the webhook's guarded `db.batch` (mark paid + decrement stock) for that order;
- re-reads the order (expect `status='paid'`) and the variant (expect `stock 4`);
- replays the same guarded `db.batch` and confirms the order stays `paid` and stock stays `4` (idempotency);
- cleans up all test rows;
- logs SUCCESS or the failure.

Run: `pnpm exec tsx --env-file .env.local scripts/_p2_probe.ts`. Confirm SUCCESS. Then delete the probe (`rm scripts/_p2_probe.ts`) — do NOT commit it. If it fails, report BLOCKED with the exact error.

- [ ] **Step 5: Build check**

Run: `pnpm build`. The build is expected to fail only at the pre-existing email API routes (`/api/send`, `/api/send-bulk` — missing email keys). Confirm webpack compiles all shop routes including `/shop/cart`, `/shop/checkout`, `/shop/checkout/processing`, `/shop/orders`, `/shop/orders/[orderNumber]`, and `/api/webhooks/paystack`.

- [ ] **Step 6: Commit**

```bash
git add middleware.ts
git commit -m "feat: gate checkout and orders routes"
```

---

## Final verification checklist

- [ ] All test suites pass (`pnpm test`).
- [ ] `pnpm exec tsc --noEmit` clean.
- [ ] `pnpm build` compiles all shop routes (email-route failure is pre-existing).
- [ ] The Task 16 runtime probe confirmed: checkout insert, webhook mark-paid + stock decrement, and webhook idempotency.
- [ ] Manual (user, with Paystack test keys + a Clerk session): add to cart → checkout → Paystack test card → redirected to order page → order shows `paid`, stock decremented, confirmation email attempted.

## Environment variables (user must add to `.env.local`)

- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — Paystack test keys.
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally; the deployed URL in production.
- The Paystack dashboard webhook URL must point to `<site>/api/webhooks/paystack`.

## Self-Review Notes

- **Spec coverage:** cart (Tasks 1–6), checkout flow (Tasks 11–12), Paystack
  init + webhook (Tasks 8, 13), shipping-mark assignment + matching (Task 9),
  order records (Task 11), customer order pages (Task 15), confirmation email
  (Task 14), delivery zones (Task 10), route gating (Task 16). All Phase 2 spec
  sections map to a task.
- **Transaction approach:** every atomic write uses `db.batch()` or a guarded
  single `UPDATE` — consistent with the resolved spec decision; no
  `db.transaction()` anywhere.
- **Type consistency:** `CartItem` defined in `lib/shop/cart.ts`, used by the
  context and components. `CheckoutResult` in `checkout.ts`. The webhook's
  guarded updates and the checkout insert both use the `orders`/`orderItems`/
  `productVariants` schema tables consistently.
- **Known carry-over from Phase 1:** Phase 1's `updateProduct` re-inserts
  variants (new ids). Now that `order_items.variantId` is a real FK, an admin
  editing a product that already has orders could fail the variant delete or
  orphan the FK. This is flagged for Phase 3 (which revisits product/variant
  admin) — out of scope for Phase 2 but must not be forgotten.
