# Shop — Phase 1: Foundation & Storefront — Design

**Date:** 2026-05-18
**Status:** Approved design, pending implementation plan

## Context

The business (Lucky Godday Business Services / "Ship With Godday") wants an
e-commerce shop that shares the design language of the existing marketing site.
The shop is built **inside the existing Next.js project** as route groups, not a
separate project or subdomain — this reuses the design system, shadcn
components, Clerk auth, and `globals.css` tokens, and keeps SEO/domain authority
consolidated.

The full e-commerce build is decomposed into three phases, each with its own
spec → plan → implementation cycle:

- **Phase 1 (this spec)** — Foundation: data layer, schema, Excel importer,
  Cloudinary, category + product admin CRUD, storefront catalog + product pages.
- **Phase 2** — Cart, checkout, Paystack payments, shipping-mark assignment,
  order records, customer order history, confirmation emails.
- **Phase 3** — Admin depth: orders management, customers module, dashboard
  analytics, delivery-zone management.

## Goals (Phase 1)

1. Stand up a Postgres data layer (Drizzle ORM on Neon) alongside the existing
   MongoDB/Mongoose setup. The two databases serve independent domains.
2. Define the **complete** shop schema (all tables) in one migration set, even
   though some tables are exercised in later phases.
3. Import the existing customer list from `SWG CUSTOMER LIST.xlsx` and seed the
   shipping-mark sequence.
4. Provide an admin area to manage categories and products (with variants,
   stock, and images).
5. Provide a customer-facing storefront: shop landing, catalog with filters, and
   product detail pages.

## Non-goals (Phase 1)

- Cart, checkout, payments (Phase 2).
- Order placement and shipping-mark assignment logic (Phase 2).
- Customers admin module, orders admin module, analytics dashboard (Phase 3).
- Delivery-zone management UI (Phase 3) — the `delivery_zones` table is created
  in Phase 1 but managed via seed data for now.

## Decisions (locked)

| Area | Decision |
|------|----------|
| Project layout | Same project; `app/(shop)/` + `app/admin/` route groups |
| Auth | Clerk for customers and admin; admins have `publicMetadata.role === 'admin'` |
| Data layer | Drizzle ORM on Neon Postgres (`@neondatabase/serverless`) |
| Products | Variant-based; every product has ≥1 variant (default variant for simple products) |
| Inventory | Stock tracked per variant |
| Delivery | Fee by region/zone (table created Phase 1, used Phase 2) |
| Payments | Paystack (Phase 2) |
| Images | Cloudinary (signed uploads via server action) |
| Money | Stored as integer pesewas (GHS minor units) |

## Architecture

```
app/(shop)/                       customer storefront — uses global Navbar/Footer
  layout.tsx                       (Phase 2 adds CartProvider; Phase 1: passthrough)
  shop/page.tsx                    storefront landing — featured/active products
  shop/products/page.tsx           catalog — category + price filters
  shop/products/[slug]/page.tsx    product detail + variant display

app/admin/
  layout.tsx                       admin shell — sidebar (uses sidebar-* tokens)
  page.tsx                         placeholder overview (full dashboard in Phase 3)
  categories/page.tsx              category list
  categories/new/page.tsx          create category
  categories/[id]/page.tsx         edit category
  products/page.tsx                product list
  products/new/page.tsx            create product
  products/[id]/page.tsx           edit product (variants + images)

app/actions/shop/                  server actions for admin mutations
  categories.ts                    create/update/delete category
  products.ts                      create/update/delete product, variants
  images.ts                        Cloudinary signed-upload signature + delete

lib/db/
  index.ts                         Drizzle client bound to the Neon driver
  schema.ts                        all shop tables
lib/cloudinary.ts                  Cloudinary server config + helpers

scripts/
  import-customers.ts              one-off Excel importer

drizzle/                           generated migrations (drizzle-kit)
drizzle.config.ts                  drizzle-kit config

components/shop/                    ProductCard, ProductGrid, ProductFilters,
                                    VariantDisplay, ProductGallery, EmptyState
components/admin/                   AdminSidebar, AdminHeader, DataTable,
                                    CategoryForm, ProductForm, VariantEditor,
                                    ImageUploader, ProductsTable, CategoriesTable
```

**Data access pattern:** Server Components read directly via Drizzle. Mutations
go through Server Actions in `app/actions/shop/` (matches the existing
`app/actions/` convention). No REST API routes are needed in Phase 1 (the
Paystack webhook in Phase 2 will be the first API route the shop adds).

## Database schema (Drizzle / Postgres)

All tables created in one Phase 1 migration. Money columns are `integer`
(pesewas). Timestamps are `timestamptz` with defaults.

### `categories`
- `id` uuid pk
- `name` text not null
- `slug` text not null unique
- `description` text
- `image_url` text
- `created_at`, `updated_at` timestamptz

### `products`
- `id` uuid pk
- `name` text not null
- `slug` text not null unique
- `description` text (rich text / HTML)
- `category_id` uuid fk → categories (nullable; on delete set null)
- `status` text not null — enum-like: `draft` | `active` | `archived`
- `featured` boolean not null default false
- `created_at`, `updated_at` timestamptz

### `product_images`
- `id` uuid pk
- `product_id` uuid fk → products (on delete cascade)
- `url` text not null (Cloudinary secure_url)
- `public_id` text not null (Cloudinary public_id, for deletion)
- `alt` text
- `position` integer not null default 0

### `product_variants`
- `id` uuid pk
- `product_id` uuid fk → products (on delete cascade)
- `name` text not null (e.g. "Large / Red"; "Default" for simple products)
- `sku` text unique (nullable)
- `price` integer not null (pesewas)
- `compare_at_price` integer (nullable, pesewas)
- `stock_quantity` integer not null default 0
- `position` integer not null default 0

### `customers`
- `id` uuid pk
- `clerk_user_id` text unique **nullable** (imported/offline customers have none)
- `shipping_mark` text not null unique (e.g. `GD352`)
- `shipping_mark_no` integer not null (numeric part, e.g. `352`)
- `name` text
- `email` text
- `phone` text
- `source` text not null default `'system'` — `'import'` | `'system'`
- `created_at`, `updated_at` timestamptz

Indexes on `lower(email)` and `phone` to support Phase 2 matching.

### `delivery_zones`
- `id` uuid pk
- `name` text not null (region)
- `fee` integer not null (pesewas)
- `active` boolean not null default true

### `orders` (created Phase 1, exercised Phase 2)
- `id` uuid pk
- `order_number` text not null unique
- `customer_id` uuid fk → customers
- `status` text not null — `pending` | `paid` | `processing` | `shipped` |
  `delivered` | `cancelled`
- `subtotal`, `delivery_fee`, `total` integer not null (pesewas)
- `delivery_zone_id` uuid fk → delivery_zones (nullable)
- shipping address: `ship_name`, `ship_phone`, `ship_address`, `ship_city`,
  `ship_region` text
- `paystack_reference` text (nullable)
- `created_at`, `updated_at` timestamptz

### `order_items` (created Phase 1, exercised Phase 2)
- `id` uuid pk
- `order_id` uuid fk → orders (on delete cascade)
- `variant_id` uuid fk → product_variants
- `product_name` text not null (snapshot)
- `variant_name` text not null (snapshot)
- `unit_price` integer not null (snapshot, pesewas)
- `quantity` integer not null

### Shipping-mark sequence
A dedicated Postgres sequence `shipping_mark_seq` allocates the numeric part.
- Created by the migration.
- After the importer runs, the sequence is set so the next value is
  `max(shipping_mark_no) + 1` (i.e. `GD352` given the current sheet).
- Phase 2 allocates a mark with `nextval('shipping_mark_seq')` →
  `'GD' || value`. `nextval` is concurrency-safe; gaps from rolled-back
  transactions are acceptable (the source sheet already has gaps).

## Excel importer (`scripts/import-customers.ts`)

A one-off, idempotent-where-possible script run once during Phase 1 setup.

- Reads **Table 1 only** from `SWG CUSTOMER LIST.xlsx` (the JJ sheet is ignored).
- Parses each row into `{ shipping_mark, name, phone, email }`.
- **Normalisation / tolerance rules:**
  - Trim trailing/leading whitespace from all cells (e.g. `"GD350 "` → `GD350`).
  - Parse the numeric part of the mark for `shipping_mark_no`. Marks that don't
    match `^GD\d+$` (e.g. `GD/MM`) are imported with `shipping_mark` preserved
    and `shipping_mark_no` set to `0` so they never collide with the sequence.
  - Blank name / email / phone → stored as `null`.
  - Phone values that are non-numeric (e.g. `"WeChat"`, `"WECHAT"`) are stored
    as-is in `phone` (text column); no validation.
  - Names with non-Latin characters are preserved verbatim (UTF-8).
  - Numbering gaps (missing GD340, GD346, GD347, …) are expected — the importer
    does not create placeholder rows.
- All imported rows get `source = 'import'` and `clerk_user_id = null`.
- After insert, the script sets `shipping_mark_seq` so the next value is
  `max(shipping_mark_no) + 1`.
- Re-running guard: the script aborts if `customers` already contains rows with
  `source = 'import'`, to avoid duplicate imports.

## Cloudinary integration

- Config in `lib/cloudinary.ts`; secrets in env vars (`CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- **Signed uploads:** the `images.ts` server action generates a signature; the
  browser uploads the file directly to Cloudinary with that signature. The API
  secret never reaches the client.
- On successful upload, the client passes back `secure_url` + `public_id`, and a
  server action inserts a `product_images` row.
- Deleting a product image calls Cloudinary's destroy API (server-side) then
  removes the DB row.

## Admin auth

- Admins are Clerk users with `publicMetadata.role === 'admin'`.
- `middleware.ts` is extended: the existing `isProtectedRoute` matcher gains
  `/admin(.*)`. For `/admin` routes the middleware additionally checks the role
  claim and redirects non-admins to `/` (or a 403 page).
- The admin `layout.tsx` re-checks the role server-side as defence in depth.

## Storefront pages

- **`/shop`** — landing: featured products grid, category links. Server
  Component reading active products.
- **`/shop/products`** — catalog: all `active` products, filterable by category
  and price. Filters via URL search params (server-rendered).
- **`/shop/products/[slug]`** — product detail: image gallery, description,
  variant display with per-variant price/stock, out-of-stock state. No
  add-to-cart yet (Phase 2 adds it).
- A **"Shop"** link is added to `components/shared/navbar/navItems.ts`.

## Design language

Reuses `globals.css` tokens (primary gold `#e4bb25`, accent orange), existing
shadcn components (`button`, `input`, `select`, `checkbox`, `alert`), and
`components/shared/` (`container`, `section-header`). Additional shadcn
components to add as needed: `card`, `table`, `badge`, `dialog`, `dropdown-menu`.
The admin sidebar uses the `sidebar-*` CSS variables already defined in
`globals.css`.

## Error handling

- Server actions return typed result objects (`{ ok: true }` /
  `{ ok: false, error }`); forms surface errors via the existing `alert`
  component.
- Slug uniqueness conflicts are caught and reported as field-level errors.
- Cloudinary upload failures leave no orphan DB row (DB write happens only after
  a confirmed upload).
- The importer logs per-row outcomes and a final summary; a malformed row is
  logged and skipped rather than aborting the whole run.

## Testing

- Jest is already configured. Unit tests for:
  - Shipping-mark parsing/normalisation (the `^GD\d+$` logic, trimming, the
    `GD/MM` edge case).
  - Slug generation.
  - Server-action validation (zod schemas for category/product/variant input).
- The importer is verified by running it against the real file in a scratch DB
  and asserting row count (347) and `max(shipping_mark_no) = 351`.

## Environment variables (new)

- `DATABASE_URL` — Neon Postgres connection string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## New dependencies

- `drizzle-orm`, `drizzle-kit` (dev)
- `cloudinary`
- An xlsx parser for the importer (`xlsx` or similar) — dev/script only

## Open questions

None blocking. Delivery-zone seed values and the admin role-assignment process
(how the owner's Clerk account gets `role: admin`) are confirmed as a manual
one-time setup step, documented in the implementation plan.
