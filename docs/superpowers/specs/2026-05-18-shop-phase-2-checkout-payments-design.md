# Shop — Phase 2: Cart, Checkout & Payments — Design

**Date:** 2026-05-18
**Status:** Approved design, pending implementation plan
**Depends on:** Phase 1 (foundation, schema, storefront, product admin)

## Context

Phase 1 delivers a browsable storefront and product admin. Phase 2 makes the
shop transactional: customers can add products to a cart, check out, pay via
Paystack, and receive an order. This phase also implements shipping-mark
assignment (mark allocated on first order, with matching against imported
customers) and order confirmation emails.

See `2026-05-18-shop-phase-1-foundation-design.md` for the locked decisions and
schema. This spec adds no new tables — `orders` and `order_items` were created
in Phase 1's migration and are exercised here.

## Goals (Phase 2)

1. Client-side cart with persistence, surfaced via a cart drawer and cart page.
2. A checkout flow: shipping address, delivery region selection, order review.
3. Paystack integration — hosted checkout initialization and a signature-verified
   webhook as the source of truth for payment.
4. Order creation with server-computed totals and snapshotted line items.
5. Shipping-mark assignment on first order, with email-then-phone matching
   against existing (imported) customers.
6. Stock decrement on confirmed payment, inside a transaction.
7. Customer-facing order history and order detail/confirmation pages.
8. Order confirmation emails reusing the existing `lib/` email setup.

## Non-goals (Phase 2)

- Admin orders/customers management UI (Phase 3).
- Dashboard analytics (Phase 3).
- Delivery-zone management UI (Phase 3) — zones come from Phase 1 seed data.
- Refunds, partial fulfilment, multi-currency.

## Architecture

```
app/(shop)/
  layout.tsx                       wraps children in CartProvider + CartDrawer
  shop/cart/page.tsx               full cart page
  shop/checkout/page.tsx           checkout — address, region, review (auth required)
  shop/checkout/processing/page.tsx  post-Paystack landing — verifies + redirects
  shop/orders/page.tsx             customer order history (auth required)
  shop/orders/[orderNumber]/page.tsx  order detail / confirmation

app/api/
  webhooks/paystack/route.ts       Paystack webhook — HMAC-verified, source of truth

app/actions/shop/
  checkout.ts                      create pending order, initialize Paystack
  orders.ts                        verify-by-reference fallback, read customer orders

lib/
  cart-context.tsx                 client cart (mirrors lib/booking-context.tsx)
  paystack.ts                      Paystack server helpers (init, verify, HMAC)
  shipping-mark.ts                 mark allocation + customer matching
  emails.ts / mailjet.ts           existing email infra — add order-confirmation template

components/shop/
  CartDrawer, CartLineItem, CartSummary, AddToCartButton, QuantityStepper,
  CheckoutForm, RegionSelect, OrderReview, OrderSummary, OrderStatusBadge
```

## Cart

- **Client-side only**, no server cart record. State lives in `cart-context.tsx`
  (a React context provider mirroring the existing `booking-context.tsx`
  pattern), persisted to `localStorage`.
- A cart item references a `variant_id` and quantity. Display data
  (name, price, image) is read on render; price shown is informational —
  **authoritative pricing is recomputed server-side at checkout**.
- The `CartProvider` is mounted in `app/(shop)/layout.tsx` so it spans all shop
  pages. A cart icon with item count is added to the navbar.
- `AddToCartButton` (added to the Phase 1 product detail page) and a
  `CartDrawer` (a shadcn `sheet`) provide quick access.
- Out-of-stock or archived variants are flagged in the cart and blocked from
  checkout.

## Checkout flow

1. `/shop/checkout` requires a signed-in Clerk user (enforced in middleware).
2. The customer enters shipping details: name, phone, address, city, and
   selects a **delivery region** (from active `delivery_zones`). The region's
   `fee` is applied as `delivery_fee`.
3. `OrderReview` shows line items, subtotal, delivery fee, and total — all
   **computed by the server** from current `product_variants` data, never from
   client-supplied prices.
4. Submitting calls the `checkout.ts` server action, which:
   - Re-validates every cart variant exists, is `active`, and has sufficient
     stock. Insufficient stock → return an error listing the affected items.
   - Resolves/creates the customer (see Shipping-mark assignment below).
   - Inserts an `orders` row with `status = 'pending'`, server-computed
     `subtotal` / `delivery_fee` / `total`, a generated `order_number`, and the
     shipping address snapshot.
   - Inserts `order_items` rows with **snapshotted** `product_name`,
     `variant_name`, `unit_price`.
   - Initializes a Paystack transaction (amount in pesewas, customer email,
     `reference = order_number`, `callback_url` → `/shop/checkout/processing`)
     and stores `paystack_reference`.
   - Returns the Paystack `authorization_url`.
5. The browser redirects to Paystack's hosted checkout page.
6. Stock is **not** decremented at this point — only on confirmed payment.

`order_number` format: a short, human-readable, collision-resistant string
(e.g. `SWG-` + a zero-padded incrementing value or a short random suffix); it
doubles as the Paystack reference.

## Payment confirmation

Two paths converge; the webhook is authoritative, the callback page is a
fallback for UX.

**Webhook — `app/api/webhooks/paystack/route.ts` (source of truth):**
- Verifies the `x-paystack-signature` HMAC-SHA512 of the raw request body
  against `PAYSTACK_SECRET_KEY`. Invalid signature → `401`.
- On a `charge.success` event, in a single DB transaction:
  - Loads the order by `reference`. If already `paid`, no-op (idempotent).
  - Re-checks variant stock; marks `status = 'paid'`.
  - Decrements `stock_quantity` for each line item's variant.
  - Commits.
- After commit, sends the order confirmation email.
- Always returns `200` quickly for recognised events so Paystack does not retry
  unnecessarily; unrecognised events are acknowledged and ignored.

**Callback page — `/shop/checkout/processing`:**
- Receives the Paystack `reference`, calls Paystack's verify endpoint via
  `orders.ts`, and shows a status. If verified `paid`, redirects to
  `/shop/orders/[orderNumber]`. If still pending, shows a "we're confirming your
  payment" state and polls/instructs the user.
- This page never decrements stock or mutates order state beyond what the
  webhook does — it is read/UX only. (If the webhook is delayed, the order
  becomes `paid` once the webhook lands.)

**Idempotency:** order state transitions are guarded so the webhook and any
retries cannot double-decrement stock.

## Shipping-mark assignment (`lib/shipping-mark.ts`)

Runs inside the checkout transaction, before order insert:

1. Determine the acting customer:
   - If the signed-in Clerk user already maps to a `customers` row
     (`clerk_user_id` match) → use it.
   - Else, **match an imported customer**: look up by `lower(email)` against the
     Clerk user's email; if no email match, look up by `phone` against the
     checkout phone. On match, attach the Clerk user to that row
     (set `clerk_user_id`) and reuse its existing `shipping_mark`.
   - Else, create a new `customers` row: allocate the next mark with
     `nextval('shipping_mark_seq')`, set `shipping_mark = 'GD' || value`,
     `shipping_mark_no = value`, `source = 'system'`, `clerk_user_id` set.
2. Phone matching normalises both sides (strip spaces/punctuation, compare the
   trailing significant digits) to tolerate country-code variation.
3. If a match is ambiguous (multiple rows), prefer an exact email match;
   otherwise fall through to creating a new customer (Phase 3's customers module
   provides manual merge for these cases).

## Customer order pages

- **`/shop/orders`** — lists the signed-in customer's orders (status badge,
  total, date). Auth required.
- **`/shop/orders/[orderNumber]`** — order detail: line items, totals, shipping
  address, status, shipping mark. Doubles as the post-payment confirmation page.
  Access is restricted to the owning customer (or an admin in Phase 3).

## Emails

- Reuses the existing email infrastructure (`lib/emails.ts`, `lib/mailjet.ts`,
  `lib/email-template.ts`, `components/EmailTemplate.tsx`).
- A new **order confirmation** template: order number, shipping mark, line
  items, totals, delivery region, shipping address.
- Sent by the webhook after the `paid` transaction commits. Email send failure
  is logged and does not roll back the order.

## Error handling

- Stock shortfall at checkout → typed error listing affected items; the cart
  page highlights them.
- Paystack init failure → checkout action returns an error; no order is left in
  a bad state (the `pending` order may remain and is treated as abandoned).
- Webhook signature failure → `401`, logged.
- Webhook for an unknown reference → `200` acknowledged, logged (no order
  mutated).
- Customer matching failure modes are conservative: when in doubt, create a new
  customer rather than attach to the wrong one.

## Testing

- Unit tests:
  - Server-side total computation (subtotal + delivery fee).
  - Shipping-mark allocation and the email/phone matching logic, including
    phone normalisation and the ambiguous-match fallback.
  - Paystack HMAC signature verification (valid + tampered payloads).
  - Webhook idempotency — replaying `charge.success` does not double-decrement
    stock.
- Integration: a checkout → mock webhook → order `paid` + stock decremented
  flow against a scratch DB.

## Environment variables (new)

- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`

## New dependencies

- None required beyond Phase 1; Paystack is called over HTTP via `fetch`.
  (An official Paystack SDK may be used if it simplifies init/verify.)

## Open questions

None blocking. Abandoned `pending` orders are left as-is in Phase 2; a cleanup
job can be added later if they accumulate.
