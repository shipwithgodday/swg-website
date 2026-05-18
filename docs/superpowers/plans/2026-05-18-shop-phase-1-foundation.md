# Shop Phase 1 — Foundation & Storefront — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the shop's Postgres data layer, import the existing customer list, and ship a product/category admin plus a browsable storefront — all inside the existing Next.js app.

**Architecture:** A new Postgres database (Neon) accessed via Drizzle ORM, living alongside the existing MongoDB. Shop pages are `app/(shop)/` and `app/admin/` route groups sharing the existing design system, shadcn components, and Clerk auth. Reads use Server Components querying Drizzle directly; mutations use Server Actions in `app/actions/shop/`. Product images go to Cloudinary via signed uploads.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Drizzle ORM + `drizzle-kit`, Neon Postgres (`@neondatabase/serverless`), Cloudinary, Clerk, Tailwind v4, shadcn/ui, zod, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-05-18-shop-phase-1-foundation-design.md`

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `drizzle.config.ts` | drizzle-kit config (schema path, Neon credentials) |
| `jest.config.js` | Jest config (ts-jest preset) — none exists yet |
| `lib/db/schema.ts` | All shop table definitions + relations |
| `lib/db/index.ts` | Drizzle client bound to the Neon driver |
| `lib/shop/slug.ts` | Slug generation utility |
| `lib/shop/marks.ts` | Shipping-mark parsing/normalisation (pure functions) |
| `lib/cloudinary.ts` | Cloudinary server config + helpers |
| `lib/shop/auth.ts` | `isAdmin()` / `requireAdmin()` helpers |
| `lib/shop/queries.ts` | Read helpers for storefront Server Components |
| `scripts/import-customers.ts` | One-off Excel importer |
| `app/actions/shop/categories.ts` | Category create/update/delete actions |
| `app/actions/shop/products.ts` | Product + variant create/update/delete actions |
| `app/actions/shop/images.ts` | Cloudinary signed-upload signature + image delete |
| `app/admin/layout.tsx` | Admin shell (sidebar) + server-side role gate |
| `app/admin/page.tsx` | Admin overview placeholder |
| `app/admin/categories/*` | Category list / new / edit pages |
| `app/admin/products/*` | Product list / new / edit pages |
| `app/(shop)/layout.tsx` | Shop layout (passthrough in Phase 1) |
| `app/(shop)/shop/page.tsx` | Storefront landing |
| `app/(shop)/shop/products/page.tsx` | Catalog + filters |
| `app/(shop)/shop/products/[slug]/page.tsx` | Product detail |
| `components/admin/*` | Admin sidebar, tables, forms, image uploader |
| `components/shop/*` | ProductCard, ProductGrid, filters, gallery |
| `middleware.ts` | Extended to gate `/admin` |
| `components/shared/navbar/navItems.ts` | "Shop" nav link added |

---

## Task 1: Project setup — dependencies, Jest config, env

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `.env.local` (local only, git-ignored)
- Create: `.env.example`

- [ ] **Step 1: Install runtime + dev dependencies**

```bash
pnpm add drizzle-orm @neondatabase/serverless cloudinary
pnpm add -D drizzle-kit dotenv xlsx
```

`@neondatabase/serverless` is already present — pnpm will keep it.

- [ ] **Step 2: Create `jest.config.js`**

No Jest config exists yet (the `test` script just runs `jest`). Create:

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

- [ ] **Step 3: Create `.env.example`**

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- [ ] **Step 4: Create `.env.local` with real values**

Copy `.env.example` to `.env.local` and fill in the real Neon connection string and Cloudinary credentials. Confirm `.env.local` is git-ignored (it is — `.gitignore` already covers `.env*`).

- [ ] **Step 5: Verify Jest runs**

Run: `pnpm test`
Expected: Jest starts and reports "No tests found" (no test files yet) — exits without a config error.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml jest.config.js .env.example
git commit -m "chore: add shop dependencies and Jest config"
```

---

## Task 2: Drizzle schema

**Files:**
- Create: `lib/db/schema.ts`

- [ ] **Step 1: Write the schema**

`lib/db/schema.ts` — all eight tables plus relations. Money columns are `integer` (pesewas).

```ts
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  ...timestamps,
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  status: text('status').notNull().default('draft'), // draft | active | archived
  featured: boolean('featured').notNull().default(false),
  ...timestamps,
});

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  publicId: text('public_id').notNull(),
  alt: text('alt'),
  position: integer('position').notNull().default(0),
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sku: text('sku').unique(),
  price: integer('price').notNull(), // pesewas
  compareAtPrice: integer('compare_at_price'), // pesewas
  stockQuantity: integer('stock_quantity').notNull().default(0),
  position: integer('position').notNull().default(0),
});

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: text('clerk_user_id').unique(),
    shippingMark: text('shipping_mark').notNull().unique(),
    shippingMarkNo: integer('shipping_mark_no').notNull(),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    source: text('source').notNull().default('system'), // import | system
    ...timestamps,
  },
  (t) => [
    index('customers_email_idx').on(t.email),
    index('customers_phone_idx').on(t.phone),
  ]
);

export const deliveryZones = pgTable('delivery_zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  fee: integer('fee').notNull(), // pesewas
  active: boolean('active').notNull().default(true),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id),
  status: text('status').notNull().default('pending'),
  subtotal: integer('subtotal').notNull(),
  deliveryFee: integer('delivery_fee').notNull(),
  total: integer('total').notNull(),
  deliveryZoneId: uuid('delivery_zone_id').references(
    () => deliveryZones.id
  ),
  shipName: text('ship_name'),
  shipPhone: text('ship_phone'),
  shipAddress: text('ship_address'),
  shipCity: text('ship_city'),
  shipRegion: text('ship_region'),
  paystackReference: text('paystack_reference'),
  ...timestamps,
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => productVariants.id),
  productName: text('product_name').notNull(),
  variantName: text('variant_name').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
  })
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Customer = typeof customers.$inferSelect;
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors from `lib/db/schema.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add shop database schema"
```

---

## Task 3: Drizzle client + config

**Files:**
- Create: `lib/db/index.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Create the Drizzle client**

`lib/db/index.ts`:

```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 2: Create `drizzle.config.ts`**

drizzle-kit's CLI does not load `.env.local`, so load it explicitly:

```ts
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 3: Add db scripts to `package.json`**

Add to the `scripts` block:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"import:customers": "tsx scripts/import-customers.ts"
```

Install the script runner: `pnpm add -D tsx`

- [ ] **Step 4: Commit**

```bash
git add lib/db/index.ts drizzle.config.ts package.json pnpm-lock.yaml
git commit -m "feat: add Drizzle client and drizzle-kit config"
```

---

## Task 4: Generate and apply the migration

**Files:**
- Create: `drizzle/` (generated)

- [ ] **Step 1: Generate the migration**

Run: `pnpm db:generate`
Expected: a `drizzle/0000_*.sql` file plus `drizzle/meta/` are created.

- [ ] **Step 2: Add the shipping-mark sequence to the migration**

Open the generated `drizzle/0000_*.sql` and append at the end:

```sql
CREATE SEQUENCE IF NOT EXISTS shipping_mark_seq START WITH 1;
```

This sequence allocates the numeric part of shipping marks (Phase 2 uses it; the importer in Task 6 sets its value).

- [ ] **Step 3: Apply the migration**

Run: `pnpm db:migrate`
Expected: "migrations applied" with no errors.

- [ ] **Step 4: Verify tables exist**

Run: `pnpm db:studio` (opens Drizzle Studio) — confirm all eight tables are present, then close it. Alternatively connect with `psql "$DATABASE_URL" -c "\dt"`.

- [ ] **Step 5: Commit**

```bash
git add drizzle/
git commit -m "feat: add initial shop migration with shipping-mark sequence"
```

---

## Task 5: Slug utility (TDD)

**Files:**
- Create: `lib/shop/slug.ts`
- Test: `lib/shop/slug.test.ts`

- [ ] **Step 1: Write the failing test**

`lib/shop/slug.test.ts`:

```ts
import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Blue Travel Bag')).toBe('blue-travel-bag');
  });
  it('strips punctuation', () => {
    expect(slugify('Men’s Shoes (New!)')).toBe('mens-shoes-new');
  });
  it('collapses repeated separators', () => {
    expect(slugify('  multiple   spaces  ')).toBe('multiple-spaces');
  });
  it('handles empty input', () => {
    expect(slugify('')).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/slug.test.ts`
Expected: FAIL — cannot find module `./slug`.

- [ ] **Step 3: Implement `slugify`**

`lib/shop/slug.ts`:

```ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/slug.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/slug.ts lib/shop/slug.test.ts
git commit -m "feat: add slug utility"
```

---

## Task 6: Excel customer importer (TDD)

**Files:**
- Create: `lib/shop/marks.ts`
- Test: `lib/shop/marks.test.ts`
- Create: `scripts/import-customers.ts`

- [ ] **Step 1: Write the failing test for mark parsing**

`lib/shop/marks.test.ts`:

```ts
import { parseShippingMark } from './marks';

describe('parseShippingMark', () => {
  it('parses a standard GD mark', () => {
    expect(parseShippingMark('GD351')).toEqual({
      mark: 'GD351',
      markNo: 351,
    });
  });
  it('trims surrounding whitespace', () => {
    expect(parseShippingMark('GD350 ')).toEqual({
      mark: 'GD350',
      markNo: 350,
    });
  });
  it('keeps a non-standard mark with markNo 0', () => {
    expect(parseShippingMark('GD/MM')).toEqual({
      mark: 'GD/MM',
      markNo: 0,
    });
  });
  it('returns null for an empty mark', () => {
    expect(parseShippingMark('   ')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/marks.test.ts`
Expected: FAIL — cannot find module `./marks`.

- [ ] **Step 3: Implement `parseShippingMark`**

`lib/shop/marks.ts`:

```ts
export interface ParsedMark {
  mark: string;
  markNo: number;
}

/** Parses a raw shipping-mark cell. Returns null if there is no mark. */
export function parseShippingMark(raw: string): ParsedMark | null {
  const mark = raw.trim();
  if (!mark) return null;
  const match = /^GD(\d+)$/.exec(mark);
  return { mark, markNo: match ? parseInt(match[1], 10) : 0 };
}

/** Normalises an Excel cell to a trimmed string or null. */
export function cell(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/marks.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Write the importer script**

`scripts/import-customers.ts`. It reads **Table 1 only**, skips rows with no mark, sets `source = 'import'`, and after inserting sets `shipping_mark_seq` so the next value is `max(markNo) + 1`. It aborts if imported rows already exist.

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import path from 'path';
import * as XLSX from 'xlsx';
import { sql, eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { customers } from '../lib/db/schema';
import { parseShippingMark, cell } from '../lib/shop/marks';

const FILE = path.join(process.cwd(), 'SWG CUSTOMER LIST.xlsx');
const SHEET = 'Table 1';

async function main() {
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.source, 'import'))
    .limit(1);
  if (existing.length) {
    console.error('Import aborted: imported customers already exist.');
    process.exit(1);
  }

  const workbook = XLSX.readFile(FILE);
  const sheet = workbook.Sheets[SHEET];
  if (!sheet) throw new Error(`Sheet "${SHEET}" not found`);

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: ['mark', 'name', 'phone', 'email'],
    range: 1, // skip header row
    defval: null,
  });

  const records: (typeof customers.$inferInsert)[] = [];
  let skipped = 0;

  for (const row of rows) {
    const rawMark = cell(row.mark);
    if (!rawMark) {
      skipped++;
      continue;
    }
    const parsed = parseShippingMark(rawMark);
    if (!parsed) {
      skipped++;
      continue;
    }
    records.push({
      shippingMark: parsed.mark,
      shippingMarkNo: parsed.markNo,
      name: cell(row.name),
      phone: cell(row.phone),
      email: cell(row.email),
      source: 'import',
    });
  }

  if (!records.length) throw new Error('No importable rows found');

  await db.insert(customers).values(records);

  const maxNo = records.reduce((m, r) => Math.max(m, r.shippingMarkNo), 1);
  await db.execute(sql`SELECT setval('shipping_mark_seq', ${maxNo})`);

  console.log(
    `Imported ${records.length} customers, skipped ${skipped}. ` +
      `shipping_mark_seq set to ${maxNo} (next mark: GD${maxNo + 1}).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 6: Run the importer**

Run: `pnpm import:customers`
Expected output: `Imported 347 customers, skipped <n>. shipping_mark_seq set to 351 (next mark: GD352).`

- [ ] **Step 7: Verify in the database**

Run: `psql "$DATABASE_URL" -c "select count(*), max(shipping_mark_no) from customers;"`
Expected: count `347`, max `351`.

- [ ] **Step 8: Commit**

```bash
git add lib/shop/marks.ts lib/shop/marks.test.ts scripts/import-customers.ts
git commit -m "feat: add Excel customer importer"
```

---

## Task 7: Cloudinary helper

**Files:**
- Create: `lib/cloudinary.ts`

- [ ] **Step 1: Implement the Cloudinary helper**

`lib/cloudinary.ts` — server-only config plus a signature generator for signed direct uploads and a destroy helper.

```ts
import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDER = 'shop/products';

export interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/** Builds a signature for a browser-side signed upload. */
export function createUploadSignature(): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: CLOUDINARY_FOLDER },
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    folder: CLOUDINARY_FOLDER,
  };
}

/** Deletes an asset by its Cloudinary public_id. */
export async function destroyImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

If `server-only` is not installed: `pnpm add server-only`.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/cloudinary.ts package.json pnpm-lock.yaml
git commit -m "feat: add Cloudinary helper"
```

---

## Task 8: Admin auth gate (TDD for helper)

**Files:**
- Create: `lib/shop/auth.ts`
- Test: `lib/shop/auth.test.ts`
- Modify: `middleware.ts`

- [ ] **Step 1: Write the failing test for the role check**

The role lives in Clerk `sessionClaims.metadata.role`. Extract a pure predicate so it is testable.

`lib/shop/auth.test.ts`:

```ts
import { hasAdminRole } from './auth';

describe('hasAdminRole', () => {
  it('is true when metadata.role is admin', () => {
    expect(hasAdminRole({ metadata: { role: 'admin' } })).toBe(true);
  });
  it('is false for a non-admin role', () => {
    expect(hasAdminRole({ metadata: { role: 'customer' } })).toBe(false);
  });
  it('is false when claims are null', () => {
    expect(hasAdminRole(null)).toBe(false);
  });
  it('is false when metadata is missing', () => {
    expect(hasAdminRole({})).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/auth.test.ts`
Expected: FAIL — cannot find module `./auth`.

- [ ] **Step 3: Implement `auth.ts`**

`lib/shop/auth.ts`:

```ts
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

interface ClaimsLike {
  metadata?: { role?: string };
}

/** Pure predicate: does the given session-claims object grant admin? */
export function hasAdminRole(claims: ClaimsLike | null | undefined): boolean {
  return claims?.metadata?.role === 'admin';
}

/** Server helper: true if the current request is an admin. */
export async function isAdmin(): Promise<boolean> {
  const { sessionClaims } = await auth();
  return hasAdminRole(sessionClaims as ClaimsLike | null);
}

/** Server helper: redirects non-admins away. Use in admin layouts/pages. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/');
}
```

> Note: for `sessionClaims.metadata.role` to be populated, the Clerk JWT
> template/session token must expose `metadata` (Clerk dashboard → Sessions →
> customize the session token with `{"metadata": "{{user.public_metadata}}"}`).
> Document this as a one-time Clerk setup step. Admins get
> `publicMetadata.role = "admin"` set on their Clerk user.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/auth.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Extend `middleware.ts` to gate `/admin`**

Replace the body of `middleware.ts` with:

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/email', '/api/send-bulk']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  if (isAdminRoute(request)) {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    const role = (session.sessionClaims as { metadata?: { role?: string } })
      ?.metadata?.role;
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
```

- [ ] **Step 6: Commit**

```bash
git add lib/shop/auth.ts lib/shop/auth.test.ts middleware.ts
git commit -m "feat: add admin auth gate"
```

---

## Task 9: Install shadcn components

**Files:**
- Create: `components/ui/card.tsx`, `table.tsx`, `badge.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `label.tsx`, `textarea.tsx`, `sonner.tsx`

- [ ] **Step 1: Add the components**

Run:

```bash
pnpm dlx shadcn@latest add card table badge dialog dropdown-menu label textarea sonner
```

These join the existing `button`, `input`, `select`, `checkbox`, `alert`. `sonner` provides toast feedback for admin actions.

- [ ] **Step 2: Mount the toaster**

In `app/layout.tsx`, import and render the toaster inside `<body>` after `{children}`:

```tsx
import { Toaster } from '@/components/ui/sonner';
// ...inside <body>, after <Footer />:
<Toaster />
```

- [ ] **Step 3: Verify build**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui app/layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: add shadcn components for shop"
```

---

## Task 10: Admin shell layout

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create the sidebar**

`components/admin/AdminSidebar.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, FolderTree } from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar min-h-screen p-4">
      <p className="px-3 py-2 text-lg font-semibold text-sidebar-foreground">
        Shop Admin
      </p>
      <nav className="mt-4 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
              )}>
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create the admin layout**

`app/admin/layout.tsx` — server-side role gate plus the shell:

```tsx
import { requireAdmin } from '@/lib/shop/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create the placeholder dashboard page**

`app/admin/page.tsx`:

```tsx
export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Sales metrics arrive in Phase 3. Use the sidebar to manage products
        and categories.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `pnpm dev`, sign in as an admin Clerk user, visit `/admin`.
Expected: the sidebar shell renders; a non-admin visiting `/admin` is redirected to `/`.

- [ ] **Step 5: Commit**

```bash
git add app/admin components/admin/AdminSidebar.tsx
git commit -m "feat: add admin shell layout"
```

---

## Task 11: Category server actions (TDD for validation)

**Files:**
- Create: `lib/shop/validation.ts`
- Test: `lib/shop/validation.test.ts`
- Create: `app/actions/shop/categories.ts`

- [ ] **Step 1: Write the failing test for the category schema**

`lib/shop/validation.test.ts`:

```ts
import { categoryInputSchema } from './validation';

describe('categoryInputSchema', () => {
  it('accepts a valid category', () => {
    const r = categoryInputSchema.safeParse({
      name: 'Bags',
      description: 'Travel bags',
      imageUrl: null,
    });
    expect(r.success).toBe(true);
  });
  it('rejects an empty name', () => {
    const r = categoryInputSchema.safeParse({ name: '' });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: FAIL — cannot find module `./validation`.

- [ ] **Step 3: Implement the validation schemas**

`lib/shop/validation.ts` (category schema now; product/variant schemas added in Task 13):

```ts
import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Implement the category server actions**

`app/actions/shop/categories.ts`:

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { slugify } from '@/lib/shop/slug';
import { categoryInputSchema } from '@/lib/shop/validation';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createCategory(
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, description, imageUrl } = parsed.data;
  try {
    await db.insert(categories).values({
      name,
      slug: slugify(name),
      description: description ?? null,
      imageUrl: imageUrl ?? null,
    });
  } catch {
    return { ok: false, error: 'A category with this name already exists.' };
  }
  revalidatePath('/admin/categories');
  return { ok: true };
}

export async function updateCategory(
  id: string,
  raw: unknown
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const { name, description, imageUrl } = parsed.data;
  try {
    await db
      .update(categories)
      .set({
        name,
        slug: slugify(name),
        description: description ?? null,
        imageUrl: imageUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  } catch {
    return { ok: false, error: 'A category with this name already exists.' };
  }
  revalidatePath('/admin/categories');
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath('/admin/categories');
  return { ok: true };
}
```

- [ ] **Step 6: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — expected: no errors.

```bash
git add lib/shop/validation.ts lib/shop/validation.test.ts app/actions/shop/categories.ts
git commit -m "feat: add category server actions"
```

---

## Task 12: Category admin UI

**Files:**
- Create: `components/admin/CategoryForm.tsx`
- Create: `app/admin/categories/page.tsx`
- Create: `app/admin/categories/new/page.tsx`
- Create: `app/admin/categories/[id]/page.tsx`

- [ ] **Step 1: Create the category form**

`components/admin/CategoryForm.tsx` — a client component used for create and edit:

```tsx
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createCategory,
  updateCategory,
  type ActionResult,
} from '@/app/actions/shop/categories';

interface Props {
  category?: { id: string; name: string; description: string | null };
}

export function CategoryForm({ category }: Props) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(
    category?.description ?? ''
  );
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const payload = { name, description: description || null };
      const res: ActionResult = category
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);
      if (res.ok) {
        toast.success(category ? 'Category updated' : 'Category created');
        router.push('/admin/categories');
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save category'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create the category list page**

`app/admin/categories/page.tsx`:

```tsx
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function CategoriesPage() {
  const rows = await db.query.categories.findMany({
    orderBy: (c, { asc }) => asc(c.name),
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button asChild>
          <Link href="/admin/categories/new">New category</Link>
        </Button>
      </div>
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {c.slug}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/admin/categories/${c.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                No categories yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 3: Create the new-category page**

`app/admin/categories/new/page.tsx`:

```tsx
import { CategoryForm } from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">New category</h1>
      <div className="mt-6">
        <CategoryForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the edit-category page**

`app/admin/categories/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  if (!category) notFound();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit category</h1>
      <div className="mt-6">
        <CategoryForm
          category={{
            id: category.id,
            name: category.name,
            description: category.description,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run `pnpm dev`. As an admin: create a category at `/admin/categories/new`, see it listed, edit it.
Expected: create → toast → redirect to list showing the row; edit persists.

- [ ] **Step 6: Commit**

```bash
git add components/admin/CategoryForm.tsx app/admin/categories
git commit -m "feat: add category admin UI"
```

---

## Task 13: Product + variant validation and server actions (TDD)

**Files:**
- Modify: `lib/shop/validation.ts`
- Modify: `lib/shop/validation.test.ts`
- Create: `app/actions/shop/products.ts`

- [ ] **Step 1: Add failing tests for the product schema**

Append to `lib/shop/validation.test.ts`:

```ts
import { productInputSchema } from './validation';

describe('productInputSchema', () => {
  const base = {
    name: 'Travel Bag',
    description: 'A bag',
    categoryId: null,
    status: 'draft' as const,
    featured: false,
    variants: [
      { name: 'Default', sku: null, price: 5000, stockQuantity: 10 },
    ],
  };
  it('accepts a valid product', () => {
    expect(productInputSchema.safeParse(base).success).toBe(true);
  });
  it('requires at least one variant', () => {
    expect(
      productInputSchema.safeParse({ ...base, variants: [] }).success
    ).toBe(false);
  });
  it('rejects a negative price', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        variants: [{ name: 'X', sku: null, price: -1, stockQuantity: 0 }],
      }).success
    ).toBe(false);
  });
  it('rejects an invalid status', () => {
    expect(
      productInputSchema.safeParse({ ...base, status: 'live' }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: FAIL — `productInputSchema` is not exported.

- [ ] **Step 3: Add the product/variant schemas**

Append to `lib/shop/validation.ts`:

```ts
export const variantInputSchema = z.object({
  name: z.string().trim().min(1, 'Variant name is required'),
  sku: z.string().trim().optional().nullable(),
  price: z.number().int().nonnegative('Price must be 0 or more'),
  compareAtPrice: z.number().int().nonnegative().optional().nullable(),
  stockQuantity: z.number().int().nonnegative('Stock must be 0 or more'),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean(),
  variants: z
    .array(variantInputSchema)
    .min(1, 'A product needs at least one variant'),
});

export type VariantInput = z.infer<typeof variantInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/validation.test.ts`
Expected: PASS — all category + product tests.

- [ ] **Step 5: Implement the product server actions**

`app/actions/shop/products.ts`. Create/update replace the product's variants wholesale (simplest correct behaviour for an admin form). Variants are updated by deleting and re-inserting inside a transaction.

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products, productVariants } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import { slugify } from '@/lib/shop/slug';
import { productInputSchema } from '@/lib/shop/validation';
import type { ActionResult } from './categories';

export async function createProduct(raw: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const p = parsed.data;
  try {
    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(products)
        .values({
          name: p.name,
          slug: slugify(p.name),
          description: p.description ?? null,
          categoryId: p.categoryId ?? null,
          status: p.status,
          featured: p.featured,
        })
        .returning({ id: products.id });
      await tx.insert(productVariants).values(
        p.variants.map((v, i) => ({
          productId: created.id,
          name: v.name,
          sku: v.sku ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity,
          position: i,
        }))
      );
    });
  } catch {
    return {
      ok: false,
      error: 'Could not save — a product or SKU with this name may exist.',
    };
  }
  revalidatePath('/admin/products');
  return { ok: true };
}

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
    await db.transaction(async (tx) => {
      await tx
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
        .where(eq(products.id, id));
      await tx
        .delete(productVariants)
        .where(eq(productVariants.productId, id));
      await tx.insert(productVariants).values(
        p.variants.map((v, i) => ({
          productId: id,
          name: v.name,
          sku: v.sku ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stockQuantity: v.stockQuantity,
          position: i,
        }))
      );
    });
  } catch {
    return { ok: false, error: 'Could not save the product.' };
  }
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath('/admin/products');
  return { ok: true };
}
```

> Note: re-inserting variants on edit means a variant's `id` changes. That is
> acceptable in Phase 1 — no orders reference variants yet. Phase 2 will revisit
> variant updates to preserve ids once `order_items` reference them.

- [ ] **Step 6: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — expected: no errors.

```bash
git add lib/shop/validation.ts lib/shop/validation.test.ts app/actions/shop/products.ts
git commit -m "feat: add product server actions"
```

---

## Task 14: Image server actions

**Files:**
- Create: `app/actions/shop/images.ts`

- [ ] **Step 1: Implement the image actions**

`app/actions/shop/images.ts` — issue an upload signature, persist an uploaded image, delete an image (DB row + Cloudinary asset).

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { productImages } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/shop/auth';
import {
  createUploadSignature,
  destroyImage,
  type UploadSignature,
} from '@/lib/cloudinary';
import type { ActionResult } from './categories';

export async function getUploadSignature(): Promise<UploadSignature> {
  await requireAdmin();
  return createUploadSignature();
}

export async function addProductImage(input: {
  productId: string;
  url: string;
  publicId: string;
}): Promise<ActionResult> {
  await requireAdmin();
  const existing = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(eq(productImages.productId, input.productId));
  await db.insert(productImages).values({
    productId: input.productId,
    url: input.url,
    publicId: input.publicId,
    position: existing.length,
  });
  revalidatePath(`/admin/products/${input.productId}`);
  return { ok: true };
}

export async function deleteProductImage(
  imageId: string
): Promise<ActionResult> {
  await requireAdmin();
  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId));
  if (!image) return { ok: false, error: 'Image not found.' };
  await destroyImage(image.publicId);
  await db.delete(productImages).where(eq(productImages.id, imageId));
  revalidatePath(`/admin/products/${image.productId}`);
  return { ok: true };
}
```

- [ ] **Step 2: Type-check and commit**

Run: `pnpm exec tsc --noEmit` — expected: no errors.

```bash
git add app/actions/shop/images.ts
git commit -m "feat: add product image server actions"
```

---

## Task 15: Product admin UI

**Files:**
- Create: `components/admin/VariantEditor.tsx`
- Create: `components/admin/ImageUploader.tsx`
- Create: `components/admin/ProductForm.tsx`
- Create: `app/admin/products/page.tsx`
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/page.tsx`

- [ ] **Step 1: Create the variant editor**

`components/admin/VariantEditor.tsx` — manages a list of variants. Prices are entered in cedis and converted to pesewas by the parent on submit; this component works in pesewas-free display by exposing raw cedi strings.

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

export interface VariantRow {
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

interface Props {
  variants: VariantRow[];
  onChange: (next: VariantRow[]) => void;
}

export function VariantEditor({ variants, onChange }: Props) {
  function update(i: number, patch: Partial<VariantRow>) {
    onChange(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  return (
    <div className="space-y-4">
      <Label>Variants</Label>
      {variants.map((v, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end rounded-md border p-3">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input
              value={v.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="e.g. Large"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">SKU</Label>
            <Input
              value={v.sku}
              onChange={(e) => update(i, { sku: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Price (GHS)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={v.priceCedis}
              onChange={(e) => update(i, { priceCedis: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stock</Label>
            <Input
              type="number"
              min="0"
              value={v.stockQuantity}
              onChange={(e) =>
                update(i, { stockQuantity: e.target.value })
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={variants.length === 1}
            onClick={() =>
              onChange(variants.filter((_, idx) => idx !== i))
            }>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...variants, { ...emptyVariant }])}>
        Add variant
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create the image uploader**

`components/admin/ImageUploader.tsx` — requests a signature, uploads directly to Cloudinary, then persists via the server action. Only usable on the edit page (needs a `productId`).

```tsx
'use client';
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  getUploadSignature,
  addProductImage,
  deleteProductImage,
} from '@/app/actions/shop/images';

interface Img {
  id: string;
  url: string;
}

export function ImageUploader({
  productId,
  images,
}: {
  productId: string;
  images: Img[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const sig = await getUploadSignature();
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', sig.apiKey);
      form.append('timestamp', String(sig.timestamp));
      form.append('signature', sig.signature);
      form.append('folder', sig.folder);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: 'POST', body: form }
      );
      if (!res.ok) throw new Error('Upload failed');
      const data = (await res.json()) as {
        secure_url: string;
        public_id: string;
      };
      const saved = await addProductImage({
        productId,
        url: data.secure_url,
        publicId: data.public_id,
      });
      if (saved.ok) {
        toast.success('Image added');
        router.refresh();
      } else {
        toast.error(saved.error);
      }
    } catch {
      toast.error('Image upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  function remove(id: string) {
    start(async () => {
      const res = await deleteProductImage(id);
      if (res.ok) {
        toast.success('Image removed');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Label>Images</Label>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative">
            <Image
              src={img.url}
              alt=""
              width={96}
              height={96}
              className="size-24 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute -right-2 -top-2 rounded-full bg-destructive px-2 text-xs text-white">
              ×
            </button>
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={onFile}
        disabled={busy}
      />
      {busy && <p className="text-sm text-muted-foreground">Uploading…</p>}
    </div>
  );
}
```

Add the Cloudinary host to `next.config.ts` `images.remotePatterns` so `next/image` allows it:

```ts
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
},
```

(Merge with any existing `images` config.)

- [ ] **Step 3: Create the product form**

`components/admin/ProductForm.tsx`. Converts cedi prices to integer pesewas on submit (`Math.round(parseFloat(x) * 100)`).

```tsx
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VariantEditor,
  emptyVariant,
  type VariantRow,
} from './VariantEditor';
import {
  createProduct,
  updateProduct,
} from '@/app/actions/shop/products';

type Status = 'draft' | 'active' | 'archived';

interface Props {
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    status: Status;
    featured: boolean;
    variants: VariantRow[];
  };
}

export function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(
    product?.description ?? ''
  );
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? ''
  );
  const [status, setStatus] = useState<Status>(product?.status ?? 'draft');
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants ?? [{ ...emptyVariant }]
  );
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      description: description || null,
      categoryId: categoryId || null,
      status,
      featured,
      variants: variants.map((v) => ({
        name: v.name,
        sku: v.sku || null,
        price: Math.round(parseFloat(v.priceCedis || '0') * 100),
        stockQuantity: parseInt(v.stockQuantity || '0', 10),
      })),
    };
    start(async () => {
      const res = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);
      if (res.ok) {
        toast.success(product ? 'Product updated' : 'Product created');
        router.push('/admin/products');
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="featured"
          checked={featured}
          onCheckedChange={(c) => setFeatured(c === true)}
        />
        <Label htmlFor="featured">Featured on storefront</Label>
      </div>
      <VariantEditor variants={variants} onChange={setVariants} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save product'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Create the product list page**

`app/admin/products/page.tsx`:

```tsx
import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function ProductsPage() {
  const rows = await db.query.products.findMany({
    with: { variants: true, category: true },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </div>
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Variants</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {p.category?.name ?? '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    p.status === 'active' ? 'default' : 'secondary'
                  }>
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell>{p.variants.length}</TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No products yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 5: Create the new-product page**

`app/admin/products/new/page.tsx`:

```tsx
import { db } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const categories = await db.query.categories.findMany({
    columns: { id: true, name: true },
    orderBy: (c, { asc }) => asc(c.name),
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">New product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Save the product first, then add images on the edit screen.
      </p>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create the edit-product page**

`app/admin/products/[id]/page.tsx` — form plus the image uploader:

```tsx
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: {
      variants: { orderBy: (v, { asc }) => asc(v.position) },
      images: { orderBy: (i, { asc }) => asc(i.position) },
    },
  });
  if (!product) notFound();

  const categories = await db.query.categories.findMany({
    columns: { id: true, name: true },
    orderBy: (c, { asc }) => asc(c.name),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          status: product.status as 'draft' | 'active' | 'archived',
          featured: product.featured,
          variants: product.variants.map((v) => ({
            name: v.name,
            sku: v.sku ?? '',
            priceCedis: (v.price / 100).toFixed(2),
            stockQuantity: String(v.stockQuantity),
          })),
        }}
      />
      <ImageUploader
        productId={product.id}
        images={product.images.map((i) => ({ id: i.id, url: i.url }))}
      />
    </div>
  );
}
```

- [ ] **Step 7: Verify end to end**

Run `pnpm dev`. As admin: create a product with two variants → appears in list; open it, upload an image (confirm it lands in Cloudinary and renders), edit a variant price, set status `active`.

- [ ] **Step 8: Commit**

```bash
git add components/admin app/admin/products next.config.ts
git commit -m "feat: add product admin UI"
```

---

## Task 16: Storefront query helpers + money formatting (TDD for formatting)

**Files:**
- Create: `lib/shop/money.ts`
- Test: `lib/shop/money.test.ts`
- Create: `lib/shop/queries.ts`

- [ ] **Step 1: Write the failing test for money formatting**

`lib/shop/money.test.ts`:

```ts
import { formatCedis } from './money';

describe('formatCedis', () => {
  it('formats pesewas as a cedi string', () => {
    expect(formatCedis(500000)).toBe('GHS 5,000.00');
  });
  it('formats zero', () => {
    expect(formatCedis(0)).toBe('GHS 0.00');
  });
  it('formats sub-cedi amounts', () => {
    expect(formatCedis(50)).toBe('GHS 0.50');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/shop/money.test.ts`
Expected: FAIL — cannot find module `./money`.

- [ ] **Step 3: Implement `formatCedis`**

`lib/shop/money.ts`:

```ts
/** Formats an integer pesewa amount as a GHS string. */
export function formatCedis(pesewas: number): string {
  return `GHS ${(pesewas / 100).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/shop/money.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Implement storefront query helpers**

`lib/shop/queries.ts` — read helpers shared by the storefront Server Components. A product's display price is the lowest variant price; availability is whether any variant has stock.

```ts
import { and, eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';

export async function getActiveProducts(categorySlug?: string) {
  return db.query.products.findMany({
    where: categorySlug
      ? (p, { eq: e, and: a }) =>
          a(
            e(p.status, 'active'),
            // category filter applied after fetch below if needed
          )
      : (p, { eq: e }) => e(p.status, 'active'),
    with: {
      variants: { orderBy: (v) => asc(v.position) },
      images: { orderBy: (i) => asc(i.position), limit: 1 },
      category: true,
    },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
}

export async function getFeaturedProducts() {
  return db.query.products.findMany({
    where: (p, { eq: e, and: a }) =>
      a(e(p.status, 'active'), e(p.featured, true)),
    with: {
      variants: { orderBy: (v) => asc(v.position) },
      images: { orderBy: (i) => asc(i.position), limit: 1 },
    },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: (p, { eq: e, and: a }) =>
      a(e(p.slug, slug), e(p.status, 'active')),
    with: {
      variants: { orderBy: (v) => asc(v.position) },
      images: { orderBy: (i) => asc(i.position) },
      category: true,
    },
  });
}

export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (c, { asc: a }) => a(c.name),
  });
}

/** Lowest variant price (pesewas) for display. */
export function displayPrice(variants: { price: number }[]): number {
  return variants.reduce(
    (min, v) => (v.price < min ? v.price : min),
    variants[0]?.price ?? 0
  );
}

/** True if any variant has stock. */
export function inStock(variants: { stockQuantity: number }[]): boolean {
  return variants.some((v) => v.stockQuantity > 0);
}
```

> Note: category filtering by slug is finalised in Task 18, which resolves the
> slug to an id and passes it to a query. `getActiveProducts` is simplified here
> to status-only; Task 18 adds the category-id variant.

- [ ] **Step 6: Run all tests and commit**

Run: `pnpm test` — expected: all suites pass.

```bash
git add lib/shop/money.ts lib/shop/money.test.ts lib/shop/queries.ts
git commit -m "feat: add storefront query helpers and money formatting"
```

---

## Task 17: Storefront — shared components + landing page

**Files:**
- Create: `components/shop/ProductCard.tsx`
- Create: `components/shop/ProductGrid.tsx`
- Create: `app/(shop)/layout.tsx`
- Create: `app/(shop)/shop/page.tsx`

- [ ] **Step 1: Create `ProductCard`**

`components/shop/ProductCard.tsx`:

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatCedis } from '@/lib/shop/money';
import { displayPrice, inStock } from '@/lib/shop/queries';

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  variants: { price: number; stockQuantity: number }[];
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const available = inStock(product.variants);
  return (
    <Link
      href={`/shop/products/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md">
      <div className="relative aspect-square bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {!available && (
          <Badge variant="secondary" className="absolute left-2 top-2">
            Out of stock
          </Badge>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium">{product.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatCedis(displayPrice(product.variants))}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create `ProductGrid`**

`components/shop/ProductGrid.tsx`:

```tsx
import { ProductCard, type ProductCardData } from './ProductCard';

export function ProductGrid({
  products,
  empty = 'No products found.',
}: {
  products: ProductCardData[];
  empty?: string;
}) {
  if (products.length === 0) {
    return <p className="text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create the shop layout**

`app/(shop)/layout.tsx` — a passthrough in Phase 1 (Phase 2 adds `CartProvider` here):

```tsx
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 4: Create the storefront landing page**

`app/(shop)/shop/page.tsx`:

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import { ProductGrid } from '@/components/shop/ProductGrid';
import {
  getFeaturedProducts,
  getActiveProducts,
  getCategories,
} from '@/lib/shop/queries';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse products from Ship With Godday.',
};

function toCard(p: {
  slug: string;
  name: string;
  images: { url: string }[];
  variants: { price: number; stockQuantity: number }[];
}) {
  return {
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    variants: p.variants,
  };
}

export default async function ShopPage() {
  const [featured, all, categories] = await Promise.all([
    getFeaturedProducts(),
    getActiveProducts(),
    getCategories(),
  ]);

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">Shop</h1>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop/products?category=${c.slug}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {featured.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-medium">Featured</h2>
          <div className="mt-4">
            <ProductGrid products={featured.map(toCard)} />
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">All products</h2>
          <Link
            href="/shop/products"
            className="text-sm text-primary underline-offset-4 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4">
          <ProductGrid products={all.slice(0, 8).map(toCard)} />
        </div>
      </section>
    </Container>
  );
}
```

- [ ] **Step 5: Verify**

Run `pnpm dev`, visit `/shop`. With at least one `active` product (from Task 15), it renders in the grid; featured products appear in the Featured section.

- [ ] **Step 6: Commit**

```bash
git add components/shop app/\(shop\)/layout.tsx app/\(shop\)/shop/page.tsx
git commit -m "feat: add storefront landing page"
```

---

## Task 18: Storefront — catalog page with filters

**Files:**
- Modify: `lib/shop/queries.ts`
- Create: `components/shop/CategoryFilter.tsx`
- Create: `app/(shop)/shop/products/page.tsx`

- [ ] **Step 1: Add a category-aware product query**

Replace `getActiveProducts` in `lib/shop/queries.ts` with a version that accepts an optional category id:

```ts
export async function getActiveProducts(categoryId?: string) {
  return db.query.products.findMany({
    where: (p, { eq: e, and: a }) =>
      categoryId
        ? a(e(p.status, 'active'), e(p.categoryId, categoryId))
        : e(p.status, 'active'),
    with: {
      variants: { orderBy: (v) => asc(v.position) },
      images: { orderBy: (i) => asc(i.position), limit: 1 },
      category: true,
    },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: (c, { eq: e }) => e(c.slug, slug),
  });
}
```

(The `eq`/`and`/`asc` imports already exist at the top of the file.)

- [ ] **Step 2: Create the category filter**

`components/shop/CategoryFilter.tsx`:

```tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: { id: string; name: string; slug: string }[];
  activeSlug?: string;
}) {
  const pill =
    'rounded-full border border-border px-4 py-1.5 text-sm transition-colors';
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/shop/products"
        className={cn(
          pill,
          !activeSlug ? 'bg-primary text-black' : 'hover:bg-accent'
        )}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/shop/products?category=${c.slug}`}
          className={cn(
            pill,
            activeSlug === c.slug
              ? 'bg-primary text-black'
              : 'hover:bg-accent'
          )}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create the catalog page**

`app/(shop)/shop/products/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { CategoryFilter } from '@/components/shop/CategoryFilter';
import {
  getActiveProducts,
  getCategories,
  getCategoryBySlug,
} from '@/lib/shop/queries';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse the full Ship With Godday catalog.',
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;
  const categories = await getCategories();
  const activeCategory = categorySlug
    ? await getCategoryBySlug(categorySlug)
    : null;
  const products = await getActiveProducts(activeCategory?.id);

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">
        {activeCategory ? activeCategory.name : 'All products'}
      </h1>
      <div className="mt-4">
        <CategoryFilter
          categories={categories}
          activeSlug={activeCategory?.slug}
        />
      </div>
      <div className="mt-8">
        <ProductGrid
          products={products.map((p) => ({
            slug: p.slug,
            name: p.name,
            imageUrl: p.images[0]?.url ?? null,
            variants: p.variants,
          }))}
        />
      </div>
    </Container>
  );
}
```

- [ ] **Step 4: Verify**

Run `pnpm dev`, visit `/shop/products`. All active products show; clicking a category pill filters via `?category=` and the active pill highlights.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/queries.ts components/shop/CategoryFilter.tsx app/\(shop\)/shop/products/page.tsx
git commit -m "feat: add storefront catalog with category filter"
```

---

## Task 19: Storefront — product detail page

**Files:**
- Create: `components/shop/ProductGallery.tsx`
- Create: `components/shop/VariantList.tsx`
- Create: `app/(shop)/shop/products/[slug]/page.tsx`

- [ ] **Step 1: Create the gallery**

`components/shop/ProductGallery.tsx` — a client component with a selectable main image:

```tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ProductGallery({
  images,
  name,
}: {
  images: { id: string; url: string }[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-muted-foreground">
        No image
      </div>
    );
  }
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Image
          src={images[active].url}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative size-16 overflow-hidden rounded-md border',
                i === active ? 'border-primary' : 'border-border'
              )}>
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the variant list**

`components/shop/VariantList.tsx` — Phase 1 displays variants and stock; no add-to-cart yet (Phase 2 adds selection + cart).

```tsx
import { formatCedis } from '@/lib/shop/money';

interface Variant {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
}

export function VariantList({ variants }: { variants: Variant[] }) {
  return (
    <div className="space-y-2">
      {variants.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <div>
            <p className="font-medium">{v.name}</p>
            <p className="text-sm text-muted-foreground">
              {v.stockQuantity > 0
                ? `${v.stockQuantity} in stock`
                : 'Out of stock'}
            </p>
          </div>
          <p className="font-medium">{formatCedis(v.price)}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create the product detail page**

`app/(shop)/shop/products/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@/components/shared/container';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { VariantList } from '@/components/shop/VariantList';
import { getProductBySlug, inStock } from '@/lib/shop/queries';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: product.description ?? `Buy ${product.name}.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const available = inStock(product.variants);

  return (
    <Container className="py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery
          images={product.images.map((i) => ({ id: i.id, url: i.url }))}
          name={product.name}
        />
        <div>
          {product.category && (
            <p className="text-sm text-muted-foreground">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-1 text-3xl font-semibold">{product.name}</h1>
          {!available && (
            <p className="mt-2 text-sm text-destructive">
              Currently out of stock
            </p>
          )}
          {product.description && (
            <div
              className="prose mt-4 max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium">Options</h2>
            <VariantList
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: v.price,
                stockQuantity: v.stockQuantity,
              }))}
            />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Online checkout is coming soon.
          </p>
        </div>
      </div>
    </Container>
  );
}
```

> Note: `product.description` is rendered as HTML because the admin description
> field is plain text in Phase 1; a rich-text editor is out of scope. If only
> plain text is ever entered, this renders safely. Revisit if a rich editor is
> added.

- [ ] **Step 4: Verify**

Run `pnpm dev`. From `/shop`, click a product → detail page renders gallery, variants with prices/stock, and the "checkout coming soon" note. An unknown slug → 404.

- [ ] **Step 5: Commit**

```bash
git add components/shop/ProductGallery.tsx components/shop/VariantList.tsx app/\(shop\)/shop/products/\[slug\]
git commit -m "feat: add storefront product detail page"
```

---

## Task 20: Add the Shop nav link

**Files:**
- Modify: `components/shared/navbar/navItems.ts`

- [ ] **Step 1: Add the Shop link**

Edit `components/shared/navbar/navItems.ts` — add a Shop entry after Services:

```ts
export const navItems: NavItem[] = [
  {
    text: 'About Us',
    url: '/about',
  },
  {
    text: 'Services',
    subItems: [
      { text: 'Procurement Services', url: '/procurement' },
      { text: 'Shipping Solutions', url: '/shipping' },
      { text: 'Payment Facilitation', url: '/payment' },
    ],
  },
  { text: 'Shop', url: '/shop' },
  { text: 'Contact', url: '/contact' },
];
```

- [ ] **Step 2: Verify**

Run `pnpm dev`, load any marketing page — "Shop" appears in the navbar (desktop and mobile) and links to `/shop`.

- [ ] **Step 3: Commit**

```bash
git add components/shared/navbar/navItems.ts
git commit -m "feat: add Shop link to navbar"
```

---

## Final verification

- [ ] **Run the full test suite**

Run: `pnpm test`
Expected: all suites pass — `slug`, `marks`, `auth`, `validation`, `money`.

- [ ] **Type-check and build**

Run: `pnpm exec tsc --noEmit` then `pnpm build`
Expected: both succeed with no errors.

- [ ] **Manual smoke test**

1. `/admin` redirects non-admins to `/`; admins see the shell.
2. Create a category, then a product with two variants and an image.
3. Set the product `active`.
4. `/shop` shows the product; `/shop/products` filters by category; the
   product detail page renders gallery + variants.
5. `customers` table holds 347 imported rows; `shipping_mark_seq` next value is
   352 (`psql "$DATABASE_URL" -c "select nextval('shipping_mark_seq')"` returns
   352 — note this consumes the value, so only run as a final check, or use
   `select last_value from shipping_mark_seq`).

---

## Self-Review Notes

- **Spec coverage:** data layer (Tasks 2–4), full schema incl. unused-in-P1
  tables (Task 2), Excel importer (Task 6), Cloudinary (Tasks 7, 14, 15),
  admin auth (Task 8), admin shell (Task 10), category CRUD (Tasks 11–12),
  product CRUD with variants + images (Tasks 13–15), storefront landing /
  catalog / detail (Tasks 17–19), navbar link (Task 20). All Phase 1 spec
  sections map to a task.
- **Deferred-by-design (spec non-goals):** cart/checkout/orders, customers &
  orders admin modules, delivery-zone UI, analytics — none appear here.
- **Known Phase-1 simplification flagged in-plan:** product edit re-inserts
  variants (new ids); safe because nothing references variant ids until
  Phase 2, which will revisit it.
- **Type consistency:** `ActionResult` is defined once in `categories.ts` and
  imported by `products.ts` and `images.ts`. `VariantRow` is defined in
  `VariantEditor.tsx` and imported by `ProductForm.tsx`. Status union
  `'draft' | 'active' | 'archived'` is consistent across schema default,
  `productInputSchema`, and the forms.
