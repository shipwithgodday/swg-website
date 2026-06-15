# Preorder Products — Design

**Date:** 2026-05-27
**Status:** Approved by user, ready for implementation planning

## Summary

Add a "preorder" capability to the shop. Admins can flag any product as preorder; preorder products are always purchasable regardless of variant stock, and a Preorder badge (plus optional ship-estimate text) is shown on the product page, listing cards, cart, checkout, and order confirmation. Order line items snapshot the preorder state at the time of purchase so the customer's confirmation reflects what they actually ordered.

## Motivation

Some upcoming inventory will not be available immediately and needs to be sold ahead of arrival. Currently the shop disables purchase when variant stock hits zero, leaving no way to take orders for items still in production or transit.

## Data Model

### `products` table (`lib/db/schema.ts`)

Add two columns:

| Column                   | Type                | Constraints                          |
|--------------------------|---------------------|--------------------------------------|
| `is_preorder`            | boolean             | NOT NULL, default `false`            |
| `preorder_ship_estimate` | text                | NULL allowed                         |

Existing products default to `is_preorder = false`, so behavior is unchanged for them.

### `order_items` table (snapshot)

Add two columns to the existing `order_items` table (`orderItems` in `lib/db/schema.ts`):

| Column                   | Type    | Constraints                          |
|--------------------------|---------|--------------------------------------|
| `is_preorder`            | boolean | NOT NULL, default `false`            |
| `preorder_ship_estimate` | text    | NULL allowed                         |

These are populated at order-creation time by copying the current product values. They are read-only after that — the customer's confirmation always reflects what they ordered, even if the admin later toggles the product off preorder.

### Migration

A single new Drizzle migration that adds the four columns. No data backfill is needed (defaults handle it).

## Validation

`productInputSchema` in `lib/shop/validation.ts` gains:

- `isPreorder: z.boolean()` (default `false` on the form side).
- `preorderShipEstimate: z.string().trim().max(120).nullable().optional()` — if `isPreorder` is `false`, this should be coerced/persisted as `null` (don't keep stale text from a previous toggle).

## Server Actions

`createProduct` and `updateProduct` in `app/actions/shop/products.ts` pass the two new fields straight through to the DB insert/update. No structural change; one extra field-mapping per call site.

## Admin UI — `components/admin/ProductForm.tsx`

Add a new "Preorder" section, sitting near the existing Status / Featured controls:

- **Checkbox:** "This is a preorder product"
  - Helper text: *"Customers can always order this product, regardless of variant stock."*
- **Text input (conditional, shown only when the checkbox is on):** "Expected ship estimate (optional)"
  - Placeholder: `e.g. "Ships in ~2 weeks"` or `"Expected mid-June 2026"`
  - Max length: 120 characters.
  - Helper text: *"Shown to customers on the product page."*

Variant stock fields remain visible and editable — admins can still track expected inventory — but they are ignored at purchase time when the product is in preorder mode.

## Shop Product Detail Page — `app/(shop)/shop/products/[slug]/page.tsx`

Replace the current binary stock check with this precedence:

1. If `product.isPreorder` is true → render the `<PreorderBadge variant="block" />` (badge + ship-estimate text if set).
2. Else if no variant has stock → keep the existing "Currently out of stock" message.
3. Else → normal in-stock layout.

The Add-to-Cart area is always rendered for preorder products (no out-of-stock replacement).

## `AddToCartButton.tsx`

When `product.isPreorder === true`:

- Skip the `stockQuantity > 0` filter when computing selectable variants — all variants are selectable.
- `canAdd` is true whenever the chosen quantity is valid (no `max` enforced from stock).
- Button label: **"Pre-order"** instead of "Add to cart".
- Disabled state never triggers from stock; only from invalid quantity or in-flight submission.

When `product.isPreorder === false` the existing behavior is unchanged.

## Cross-Cutting UI: `<PreorderBadge />`

A new reusable component (likely at `components/shop/PreorderBadge.tsx`) with two visual variants:

- **`pill`** — compact, used on product cards, cart lines, checkout lines, and order confirmation line items.
- **`block`** — larger, used on the product detail page; also renders the `preorderShipEstimate` text underneath when present.

Both variants accept `shipEstimate?: string | null` and render it where appropriate. The pill renders only the badge; if a ship estimate exists in a context that uses `pill`, the consumer renders the estimate as muted secondary text next to or under the badge (so the badge component itself stays simple).

## Cross-Cutting UI: Surfaces

- **Product listing card** — pill badge in a consistent corner of the card.
- **Cart line item** — pill badge next to the product name; if `preorderShipEstimate` is set on the line item snapshot, show it as muted secondary text under the name.
- **Checkout line item** — same treatment as the cart line.
- **Order confirmation page** — same treatment, sourced from the order-item snapshot (not the live product).
- **Order confirmation email** — same treatment, sourced from the order-item snapshot.

## Data Flow at Order Creation

The order-creation server action (wherever the cart → order conversion happens) reads the current `isPreorder` and `preorderShipEstimate` from each product being ordered and writes them into the matching `order_items` row alongside the existing snapshot fields (price, name, etc.). Subsequent reads of the order (confirmation page, email, order history) source these values from the order-item row, never from the live product.

## Out of Scope

- No separate "preorder release date" workflow — the admin toggles `isPreorder` off manually when stock arrives. No auto-flip when a date passes.
- No partial fulfillment splitting — a mixed cart (preorder + in-stock) ships per existing logic; we do not split into multiple shipments.
- No new customer notification when a preorder ships — relies on existing order status emails.
- No admin-side filtering/reporting view for preorder products (e.g. "show me all open preorders") — possible future enhancement.

## Testing Notes (high-level, plan will expand)

- Schema migration applies cleanly and leaves existing products with `is_preorder = false`.
- Admin form: toggling the checkbox shows/hides the ship-estimate input; saving persists both fields; clearing the checkbox nulls the ship estimate.
- Validation rejects ship estimates over 120 chars.
- Product page: preorder product with no variant stock still renders Add-to-Cart enabled with "Pre-order" label.
- Product page: non-preorder product with zero stock still shows the existing out-of-stock state.
- Order creation: snapshot fields are written to the order item; later toggling the product's `isPreorder` off does not change the existing order's confirmation rendering.
- Cart, checkout, listing cards, and confirmation surfaces all render the badge consistently.
