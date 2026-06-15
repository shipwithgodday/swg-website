# Preorder Products Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "preorder" capability so admins can flag any product as preorder; preorder products are always purchasable regardless of stock, a Preorder badge (with optional ship estimate) is shown across the shop, and the preorder state is snapshotted onto order line items at order-creation time.

**Architecture:** Two new columns on `products` (`is_preorder`, `preorder_ship_estimate`) drive admin-controlled preorder state. Two mirror columns on `order_items` snapshot the state at order creation so the customer's confirmation never drifts if the product is later toggled. A small reusable `<PreorderBadge>` renders on listing cards, product page, cart, checkout summary, order summary, and the order email. The checkout server action skips the stock check for preorder items and copies the snapshot from `products` into `order_items`.

**Tech Stack:** Next.js 15 App Router, Drizzle (PostgreSQL on Neon), Zod, React 19, TypeScript, Tailwind, shadcn/ui (Checkbox, Input, Label, Badge), Clerk, Paystack, Resend, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-05-27-preorder-products-design.md`

---

## File Map

**Modify:**
- `lib/db/schema.ts` — add columns to `products` and `orderItems`
- `lib/shop/validation.ts` — extend `productInputSchema`
- `lib/shop/validation.test.ts` — add preorder cases
- `app/actions/shop/products.ts` — pass-through new fields in create/update
- `app/admin/products/page.tsx` — map new fields to `AdminProduct`
- `components/admin/ProductForm.tsx` — checkbox + conditional input
- `components/shop/ProductCard.tsx` — preorder pill in card corner
- `app/(shop)/shop/page.tsx` — pass `isPreorder` through card mapper
- `app/(shop)/shop/products/page.tsx` — pass `isPreorder` through card mapper
- `app/(shop)/shop/products/[slug]/page.tsx` — preorder badge precedence, pass to button
- `components/shop/AddToCartButton.tsx` — skip stock filter when preorder; relabel
- `lib/shop/cart.ts` — extend `CartItem` with preorder snapshot
- `components/shop/CartView.tsx` — show preorder pill + ship estimate
- `components/shop/CheckoutSummary.tsx` — show preorder pill + ship estimate
- `app/actions/shop/checkout.ts` — fetch `isPreorder` / `preorderShipEstimate`, skip stock check for preorder lines, snapshot to `orderItems`
- `components/shop/OrderSummary.tsx` — accept and render snapshot fields
- `lib/shop/order-email.ts` — show preorder note in line items

**Create:**
- `drizzle/0001_<name>.sql` — generated migration
- `components/shop/PreorderBadge.tsx` — reusable pill/block badge component

**Test (extend or add cases in):**
- `lib/shop/validation.test.ts` — preorder validation cases

---

## Task 1: Schema migration

**Files:**
- Modify: `lib/db/schema.ts:31-42` (products), `lib/db/schema.ts:116-128` (orderItems)
- Create: `drizzle/0001_<generated>.sql` (via `npm run db:generate`)

- [ ] **Step 1: Add `isPreorder` and `preorderShipEstimate` to the products table**

In `lib/db/schema.ts`, replace the existing `products` table definition (currently lines 31–42) with:

```typescript
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  status: text('status').notNull().default('draft'),
  featured: boolean('featured').notNull().default(false),
  isPreorder: boolean('is_preorder').notNull().default(false),
  preorderShipEstimate: text('preorder_ship_estimate'),
  ...timestamps,
});
```

- [ ] **Step 2: Add `isPreorder` and `preorderShipEstimate` snapshot columns to orderItems**

Replace the `orderItems` table definition (currently lines 116–128) with:

```typescript
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
  isPreorder: boolean('is_preorder').notNull().default(false),
  preorderShipEstimate: text('preorder_ship_estimate'),
});
```

- [ ] **Step 3: Generate the migration**

Run: `npm run db:generate`
Expected: a new file appears at `drizzle/0001_<adjective>_<noun>.sql` and `drizzle/meta/_journal.json` is updated. The SQL should `ALTER TABLE products ADD COLUMN ...` for the two new product columns and `ALTER TABLE order_items ADD COLUMN ...` for the two snapshot columns. No other tables should change.

Open the generated `.sql` file and visually verify it only adds the four expected columns. If anything else is changed (renames, drops), stop and investigate.

- [ ] **Step 4: Apply the migration to your dev database**

Run: `npm run db:migrate`
Expected: completes without error.

Verify by running `npm run db:studio` (or `psql`) and confirming the four new columns exist with defaults. Skip if a remote dev DB is not available — the typecheck in Step 5 still proves the schema compiles.

- [ ] **Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors introduced by the schema change). Other parts of the codebase still read products / order items without these fields, which is fine — Drizzle's row types will now include them as optional reads.

- [ ] **Step 6: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(shop): add preorder columns to products and order_items"
```

---

## Task 2: Validation schema (TDD)

**Files:**
- Modify: `lib/shop/validation.ts:26-36`
- Test: `lib/shop/validation.test.ts:18-50` (extend the existing `describe('productInputSchema', ...)` block)

- [ ] **Step 1: Write failing tests first**

In `lib/shop/validation.test.ts`, replace the existing `describe('productInputSchema', ...)` block (lines 18–50) with:

```typescript
describe('productInputSchema', () => {
  const base = {
    name: 'Travel Bag',
    description: 'A bag',
    categoryId: null,
    status: 'draft' as const,
    featured: false,
    isPreorder: false,
    preorderShipEstimate: null,
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
  it('accepts a preorder product with a ship estimate', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        isPreorder: true,
        preorderShipEstimate: 'Ships in ~2 weeks',
      }).success
    ).toBe(true);
  });
  it('accepts a preorder product without a ship estimate', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        isPreorder: true,
        preorderShipEstimate: null,
      }).success
    ).toBe(true);
  });
  it('rejects a ship estimate longer than 120 characters', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        isPreorder: true,
        preorderShipEstimate: 'x'.repeat(121),
      }).success
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- lib/shop/validation.test.ts`
Expected: the three new preorder tests FAIL (the existing schema doesn't know about `isPreorder` / `preorderShipEstimate`, so `safeParse` will pass the strict-but-unknown fields silently — but the length check on `preorderShipEstimate` will not run). At minimum the "rejects a ship estimate longer than 120 characters" test must fail.

Note: if Zod's default `.passthrough()`-vs-`.strip()` behavior makes the "accepts a preorder product" tests pass even without the schema change, that's fine — they prove they don't regress. The 120-char test is the load-bearing one.

- [ ] **Step 3: Update the schema**

In `lib/shop/validation.ts`, replace the existing `productInputSchema` (lines 26–36) with:

```typescript
export const productInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean(),
  isPreorder: z.boolean(),
  preorderShipEstimate: z
    .string()
    .trim()
    .max(120, 'Ship estimate is too long')
    .nullable()
    .optional(),
  variants: z
    .array(variantInputSchema)
    .min(1, 'A product needs at least one variant'),
  images: z.array(productImageInputSchema).default([]),
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- lib/shop/validation.test.ts`
Expected: PASS — all `productInputSchema` cases (including the three new preorder cases) pass; other validation suites still pass.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/validation.ts lib/shop/validation.test.ts
git commit -m "feat(shop): validate preorder fields on product input"
```

---

## Task 3: Server actions pass new fields through

**Files:**
- Modify: `app/actions/shop/products.ts:39-48` (insert block in createProduct), `app/actions/shop/products.ts:109-120` (update set in updateProduct)

- [ ] **Step 1: Add the new fields to the products insert in createProduct**

In `app/actions/shop/products.ts`, locate the `db.insert(products).values({ ... })` call inside `createProduct` (currently lines 40–48). Replace it with:

```typescript
db.insert(products).values({
  id: productId,
  name: p.name,
  slug: slugify(p.name),
  description: p.description ?? null,
  categoryId: p.categoryId ?? null,
  status: p.status,
  featured: p.featured,
  isPreorder: p.isPreorder,
  preorderShipEstimate: p.isPreorder
    ? (p.preorderShipEstimate ?? null)
    : null,
}),
```

The conditional ensures that turning off the checkbox always nulls out a stale estimate.

- [ ] **Step 2: Add the new fields to the products update in updateProduct**

In the same file, locate the `db.update(products).set({ ... })` call inside `updateProduct` (currently lines 109–120). Replace it with:

```typescript
const productUpdate = db
  .update(products)
  .set({
    name: p.name,
    slug: slugify(p.name),
    description: p.description ?? null,
    categoryId: p.categoryId ?? null,
    status: p.status,
    featured: p.featured,
    isPreorder: p.isPreorder,
    preorderShipEstimate: p.isPreorder
      ? (p.preorderShipEstimate ?? null)
      : null,
    updatedAt: new Date(),
  })
  .where(eq(products.id, id));
```

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS. The `ProductInput` type derived from the Zod schema now includes `isPreorder` and `preorderShipEstimate`, so both `p.isPreorder` and `p.preorderShipEstimate` are recognised.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS (validation tests, and everything else green).

- [ ] **Step 5: Commit**

```bash
git add app/actions/shop/products.ts
git commit -m "feat(shop): persist preorder fields in product create/update actions"
```

---

## Task 4: Admin form — type, UI, payload, and edit hydration

**Files:**
- Modify: `components/admin/ProductForm.tsx:30-39` (ProductFormValue), `components/admin/ProductForm.tsx:50-130` (state + submit), `components/admin/ProductForm.tsx:186-201` (Featured section + insertion point)
- Modify: `app/admin/products/page.tsx:22-42` (AdminProduct mapper)

- [ ] **Step 1: Extend `ProductFormValue` to include preorder fields**

In `components/admin/ProductForm.tsx`, replace the `ProductFormValue` interface (currently lines 30–39) with:

```typescript
export interface ProductFormValue {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  status: Status;
  featured: boolean;
  isPreorder: boolean;
  preorderShipEstimate: string | null;
  variants: VariantRow[];
  images: ProductImageRow[];
}
```

- [ ] **Step 2: Add the preorder state hooks**

Locate the block of `useState` calls inside `ProductForm` (currently lines 56–70). Immediately after the `featured` state hook (line 64), add:

```typescript
  const [isPreorder, setIsPreorder] = useState(product?.isPreorder ?? false);
  const [preorderShipEstimate, setPreorderShipEstimate] = useState(
    product?.preorderShipEstimate ?? ''
  );
```

- [ ] **Step 3: Add the preorder fields to the submit payload**

Locate the `payload` object built inside `submit` (currently lines 90–108). Insert these two lines immediately after `featured,` (line 95):

```typescript
      isPreorder,
      preorderShipEstimate: isPreorder
        ? (preorderShipEstimate.trim() || null)
        : null,
```

The full block (for reference) becomes:

```typescript
    const payload = {
      name,
      description: description || null,
      categoryId: categoryId === NO_CATEGORY ? null : categoryId,
      status,
      featured,
      isPreorder,
      preorderShipEstimate: isPreorder
        ? (preorderShipEstimate.trim() || null)
        : null,
      variants: variants.map((v) => ({
        // ...unchanged
```

- [ ] **Step 4: Render the preorder section in the form UI**

Locate the existing "Featured on storefront" block (currently lines 187–194). Immediately after that closing `</div>` (line 194), insert:

```tsx
        <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="product-preorder"
              checked={isPreorder}
              onCheckedChange={(c) => setIsPreorder(c === true)}
            />
            <Label htmlFor="product-preorder">
              This is a preorder product
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Customers can always order this product, regardless of variant
            stock. Variant stock numbers are still tracked but are not
            enforced at checkout.
          </p>
          {isPreorder && (
            <div className="space-y-2">
              <Label htmlFor="product-preorder-ship">
                Expected ship estimate (optional)
              </Label>
              <Input
                id="product-preorder-ship"
                value={preorderShipEstimate}
                onChange={(e) => setPreorderShipEstimate(e.target.value)}
                placeholder='e.g. "Ships in ~2 weeks" or "Expected mid-June"'
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                Shown to customers on the product page, cart, and order
                confirmation. Leave blank to omit.
              </p>
            </div>
          )}
        </div>
```

- [ ] **Step 5: Pass the new fields through the admin products page mapper**

In `app/admin/products/page.tsx`, replace the `products: AdminProduct[] = rows.map(...)` block (currently lines 22–42) with:

```typescript
  const products: AdminProduct[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    status: p.status as AdminProduct['status'],
    featured: p.featured,
    isPreorder: p.isPreorder,
    preorderShipEstimate: p.preorderShipEstimate,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku ?? '',
      priceCedis: (v.price / 100).toFixed(2),
      stockQuantity: String(v.stockQuantity),
    })),
    images: p.images.map((i) => ({
      id: i.id,
      url: i.url,
      publicId: i.publicId,
    })),
  }));
```

- [ ] **Step 6: TypeScript check + build**

Run: `npx tsc --noEmit`
Expected: PASS. `AdminProduct` derives from `ProductFormValue`, so its mapper now compiles against the extended interface.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/admin/ProductForm.tsx app/admin/products/page.tsx
git commit -m "feat(admin): add preorder checkbox and ship estimate to product form"
```

---

## Task 5: PreorderBadge component

**Files:**
- Create: `components/shop/PreorderBadge.tsx`

- [ ] **Step 1: Write the component**

Create `components/shop/PreorderBadge.tsx` with:

```tsx
import { Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreorderBadgeProps {
  /**
   * `pill` is the compact form used on product cards and inline cart/checkout
   * rows. `block` is the larger form used on the product detail page; it
   * stacks the badge over the ship estimate when one is provided.
   */
  variant?: 'pill' | 'block';
  /** Optional ship estimate (e.g. "Ships in ~2 weeks"). */
  shipEstimate?: string | null;
  className?: string;
}

export function PreorderBadge({
  variant = 'pill',
  shipEstimate,
  className,
}: PreorderBadgeProps) {
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary',
          className
        )}>
        <Clock3 className="size-3" />
        Preorder
      </span>
    );
  }
  return (
    <div className={cn('mt-3 inline-flex flex-col gap-1', className)}>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
        <Clock3 className="size-3.5" />
        Preorder
      </span>
      {shipEstimate && (
        <p className="text-sm text-muted-foreground">{shipEstimate}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/shop/PreorderBadge.tsx
git commit -m "feat(shop): add reusable PreorderBadge component"
```

---

## Task 6: ProductCard listing badge + grid mappers

**Files:**
- Modify: `components/shop/ProductCard.tsx:7-14` (ProductCardData), `components/shop/ProductCard.tsx:40-50` (badge area)
- Modify: `app/(shop)/shop/page.tsx:21-37` (toCard helper) and `app/(shop)/shop/page.tsx:69-72,90-93` (mapper sites)
- Modify: `app/(shop)/shop/products/page.tsx:57-62` (inline mapper)
- Modify: `app/(shop)/shop/products/[slug]/page.tsx:139-146` (related grid mapper)

- [ ] **Step 1: Extend `ProductCardData` and render the preorder pill**

In `components/shop/ProductCard.tsx`, replace the interface (lines 7–14) with:

```typescript
export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  variants: { price: number; stockQuantity: number }[];
  /** When true, shows a small gold "Featured" badge. */
  featured?: boolean;
  /** When true, shows a "Preorder" pill in place of the sold-out badge. */
  isPreorder?: boolean;
}
```

Then add a `PreorderBadge` import near the top of the file:

```typescript
import { PreorderBadge } from './PreorderBadge';
```

And replace the badge cluster (lines 40–50) with:

```tsx
        {product.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm">
            Featured
          </span>
        )}
        {product.isPreorder ? (
          <PreorderBadge
            variant="pill"
            className="absolute top-3 right-3"
          />
        ) : (
          !available && (
            <span className="absolute top-3 right-3 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Sold out
            </span>
          )
        )}
```

Preorder takes precedence over "Sold out" — a preorder product is never visually sold out, even if all its variants have zero stock.

- [ ] **Step 2: Pass `isPreorder` through `app/(shop)/shop/page.tsx`'s `toCard` helper**

Replace the `toCard` function (lines 21–37) with:

```typescript
function toCard(
  p: {
    slug: string;
    name: string;
    images: { url: string }[];
    variants: { price: number; stockQuantity: number }[];
    isPreorder: boolean;
  },
  featured = false,
) {
  return {
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    variants: p.variants,
    featured,
    isPreorder: p.isPreorder,
  };
}
```

No other change needed in this file — both `ProductGrid` mapper sites (lines 69–71 and 90–92) already use `toCard`.

- [ ] **Step 3: Pass `isPreorder` through `app/(shop)/shop/products/page.tsx`**

Replace the inline mapper (lines 56–63) with:

```tsx
            <ProductGrid
              products={products.map((p) => ({
                slug: p.slug,
                name: p.name,
                imageUrl: p.images[0]?.url ?? null,
                variants: p.variants,
                isPreorder: p.isPreorder,
              }))}
            />
```

- [ ] **Step 4: Pass `isPreorder` through related-products grid in product detail page**

In `app/(shop)/shop/products/[slug]/page.tsx`, replace the `ProductGrid` block (lines 138–147) with:

```tsx
            <ProductGrid
              products={related.map((p) => ({
                slug: p.slug,
                name: p.name,
                imageUrl: p.images[0]?.url ?? null,
                variants: p.variants,
                isPreorder: p.isPreorder,
              }))}
            />
```

- [ ] **Step 5: Typecheck and build**

Run: `npx tsc --noEmit`
Expected: PASS — `isPreorder` exists on each product row Drizzle returns from `getActiveProducts` / `getFeaturedProducts` / `getProductBySlug` because they `findMany`/`findFirst` the product table without a `columns` filter.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/shop/ProductCard.tsx app/\(shop\)/shop/page.tsx app/\(shop\)/shop/products/page.tsx app/\(shop\)/shop/products/\[slug\]/page.tsx
git commit -m "feat(shop): show Preorder pill on product listing cards"
```

---

## Task 7: Shop product detail page

**Files:**
- Modify: `app/(shop)/shop/products/[slug]/page.tsx:1-15` (imports), `app/(shop)/shop/products/[slug]/page.tsx:86-110` (badge + AddToCartButton block)

- [ ] **Step 1: Add the PreorderBadge import**

Near the top of `app/(shop)/shop/products/[slug]/page.tsx` (just under the other component imports), add:

```typescript
import { PreorderBadge } from '@/components/shop/PreorderBadge';
```

- [ ] **Step 2: Replace the out-of-stock badge with preorder-aware precedence and pass preorder props to the button**

Replace the block from the `{!available && ...}` badge through the closing `</div>` after `AddToCartButton` (currently lines 86–110) with:

```tsx
          {product.isPreorder ? (
            <PreorderBadge
              variant="block"
              shipEstimate={product.preorderShipEstimate}
            />
          ) : (
            !available && (
              <p className="mt-3 inline-flex w-fit rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                Currently out of stock
              </p>
            )
          )}
          {product.description && (
            <div
              className="prose mt-5 max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <div className="mt-8">
            <AddToCartButton
              productSlug={product.slug}
              productName={product.name}
              imageUrl={product.images[0]?.url ?? null}
              isPreorder={product.isPreorder}
              preorderShipEstimate={product.preorderShipEstimate}
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: v.price,
                stockQuantity: v.stockQuantity,
              }))}
            />
          </div>
```

> Note: this introduces two props (`isPreorder`, `preorderShipEstimate`) that don't exist on `AddToCartButton` yet — Task 8 adds them. `npx tsc --noEmit` will fail until Task 8 lands; that's the expected red→green flow.

- [ ] **Step 3: Skip typecheck (will fail by design) — proceed directly to Task 8.**

---

## Task 8: AddToCartButton — preorder behaviour

**Files:**
- Modify: `components/shop/AddToCartButton.tsx:17-22` (Props), `components/shop/AddToCartButton.tsx:30-53` (state + add), `components/shop/AddToCartButton.tsx:62-83` (variant selector), `components/shop/AddToCartButton.tsx:96-132` (stock copy + label)

- [ ] **Step 1: Extend `Props` to accept preorder state**

Replace the `Props` interface (lines 17–22) with:

```typescript
interface Props {
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  isPreorder?: boolean;
  preorderShipEstimate?: string | null;
  variants: Variant[];
}
```

- [ ] **Step 2: Wire preorder into the component body**

Replace the entire body of the function (the `return` and everything above it, currently lines 30–53) with:

```typescript
  const { addItem, itemCount, subtotal } = useCart();
  const isPreorder = !!props.isPreorder;
  const firstAvailable = isPreorder
    ? variants[0]
    : (variants.find((v) => v.stockQuantity > 0) ?? variants[0]);
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);

  const selected = variants.find((v) => v.id === selectedId);
  const max = selected?.stockQuantity ?? 0;
  const canAdd = isPreorder
    ? !!selected && qty > 0
    : !!selected && max > 0 && qty > 0 && qty <= max;

  function add() {
    if (!selected) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        variantId: selected.id,
        productSlug,
        productName,
        variantName: selected.name,
        unitPrice: selected.price,
        imageUrl,
        isPreorder,
        preorderShipEstimate: props.preorderShipEstimate ?? null,
      });
    }
    toast.success(`${productName} added to cart`);
  }
```

> This switches the function's destructured arguments to a single `props` parameter. Replace the function signature (currently lines 24–29):

```typescript
export function AddToCartButton({
  productSlug,
  productName,
  imageUrl,
  variants,
}: Props) {
```

with:

```typescript
export function AddToCartButton(props: Props) {
  const { productSlug, productName, imageUrl, variants } = props;
```

(The new `isPreorder` and `preorderShipEstimate` are accessed via `props` so the existing destructured names — `productSlug`, etc. — stay simple. Adjust if you prefer destructuring all at once.)

- [ ] **Step 3: Disable per-variant "out of stock" greyout for preorder products**

Replace the variant button block (currently lines 62–82) with:

```tsx
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const variantDisabled = !isPreorder && v.stockQuantity === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={variantDisabled}
                  onClick={() => {
                    setSelectedId(v.id);
                    setQty(1);
                  }}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    v.id === selectedId
                      ? 'border-primary bg-primary text-black'
                      : 'border-border bg-white text-foreground hover:border-foreground/30',
                    variantDisabled &&
                      'cursor-not-allowed opacity-50 line-through'
                  )}>
                  {v.name}
                </button>
              );
            })}
          </div>
```

- [ ] **Step 4: Replace stock-aware copy, quantity max, and button label**

Replace the price/qty/button block (currently lines 86–132) with:

```tsx
      {selected && (
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Price
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {formatCedis(selected.price)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPreorder
                ? props.preorderShipEstimate || 'Available to preorder'
                : max > 0
                  ? `${max} in stock`
                  : 'Out of stock'}
            </p>
          </div>
          <div className="flex items-center rounded-full border border-border bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid size-10 place-items-center rounded-full hover:bg-accent">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() =>
                setQty((q) =>
                  isPreorder ? q + 1 : Math.min(max || 1, q + 1)
                )
              }
              className="grid size-10 place-items-center rounded-full hover:bg-accent">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={add}
          disabled={!canAdd}
          size="lg"
          className="h-14 w-full gap-2.5 text-lg font-semibold">
          <ShoppingCart className="size-5" />
          {isPreorder
            ? 'Pre-order'
            : canAdd
              ? 'Add to cart'
              : 'Out of stock'}
        </Button>
```

(The preorder branch always says "Pre-order" — even when `canAdd` is false, which only happens for a quantity of zero. The non-preorder branch keeps the original "Out of stock" fallback.)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: FAIL on `addItem(...)` because `CartItem` doesn't yet include `isPreorder` / `preorderShipEstimate`. That's expected — Task 9 adds them.

If the typecheck shows any other errors (e.g. a typo in the new code, an unused import), fix those before proceeding.

---

## Task 9: CartItem snapshot + cart-context

**Files:**
- Modify: `lib/shop/cart.ts:1-15`

- [ ] **Step 1: Extend the `CartItem` interface**

Replace the contents of `lib/shop/cart.ts` with:

```typescript
/** A line in the client-side cart. Money fields are integer pesewas. */
export interface CartItem {
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  /**
   * Preorder snapshot for client-side rendering only. The authoritative
   * snapshot persisted on `order_items` is taken server-side from the
   * `products` table at order-creation time.
   */
  isPreorder: boolean;
  preorderShipEstimate: string | null;
}

/** Sum of unitPrice * quantity across all items, in pesewas. */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
```

- [ ] **Step 2: Update the cart subtotal test fixture**

In `lib/shop/cart.test.ts`, update the `item` factory to include the new fields. Replace the file with:

```typescript
import { cartSubtotal, type CartItem } from './cart';

const item = (price: number, quantity: number): CartItem => ({
  variantId: crypto.randomUUID(),
  productSlug: 'p',
  productName: 'P',
  variantName: 'V',
  unitPrice: price,
  imageUrl: null,
  quantity,
  isPreorder: false,
  preorderShipEstimate: null,
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

- [ ] **Step 3: Backwards-compat for persisted cart**

Carts are persisted in `localStorage` under `swg-shop-cart` (see `lib/cart-context.tsx`). Existing entries written before this change won't have `isPreorder` / `preorderShipEstimate`. They'll deserialise as `undefined`, which is falsy — `isPreorder` checks already use `!!i.isPreorder`-style coercion, but to be safe, normalise on load.

In `lib/cart-context.tsx`, replace the load `useEffect` (lines 41–50) with:

```typescript
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartItem>[];
        setItems(
          parsed.map((p) => ({
            variantId: p.variantId as string,
            productSlug: p.productSlug as string,
            productName: p.productName as string,
            variantName: p.variantName as string,
            unitPrice: p.unitPrice as number,
            imageUrl: p.imageUrl ?? null,
            quantity: p.quantity as number,
            isPreorder: p.isPreorder ?? false,
            preorderShipEstimate: p.preorderShipEstimate ?? null,
          }))
        );
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npm test`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: PASS — the AddToCartButton + product detail page changes from Tasks 7 and 8 now compile.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/shop/cart.ts lib/shop/cart.test.ts lib/cart-context.tsx components/shop/AddToCartButton.tsx app/\(shop\)/shop/products/\[slug\]/page.tsx
git commit -m "feat(shop): show Preorder state on product detail and carry it on cart items"
```

---

## Task 10: CartView + CheckoutSummary

**Files:**
- Modify: `components/shop/CartView.tsx:1-7` (imports), `components/shop/CartView.tsx:47-56` (line item meta)
- Modify: `components/shop/CheckoutSummary.tsx:1-6` (imports), `components/shop/CheckoutSummary.tsx:29-36` (line item meta)

- [ ] **Step 1: Show preorder pill + ship estimate in cart line items**

In `components/shop/CartView.tsx`, add the import after the existing component imports:

```typescript
import { PreorderBadge } from './PreorderBadge';
```

Replace the line-item meta block (currently lines 47–56) with:

```tsx
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/shop/products/${i.productSlug}`}
                  onClick={onNavigate}
                  className="line-clamp-1 text-sm font-medium hover:underline">
                  {i.productName}
                </Link>
                {i.isPreorder && <PreorderBadge variant="pill" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {i.variantName}
              </p>
              {i.isPreorder && i.preorderShipEstimate && (
                <p className="text-xs text-primary">
                  {i.preorderShipEstimate}
                </p>
              )}
```

(The `<div className="mt-2 flex items-center gap-3">` block that comes immediately after — quantity controls + remove — stays unchanged.)

- [ ] **Step 2: Show preorder pill + ship estimate in checkout summary**

In `components/shop/CheckoutSummary.tsx`, add the import:

```typescript
import { PreorderBadge } from './PreorderBadge';
```

Replace the line-item meta block (currently lines 29–36) with:

```tsx
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="line-clamp-1 text-sm font-medium">
                  {i.productName}
                </p>
                {i.isPreorder && <PreorderBadge variant="pill" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {i.variantName} · ×{i.quantity}
              </p>
              {i.isPreorder && i.preorderShipEstimate && (
                <p className="text-xs text-primary">
                  {i.preorderShipEstimate}
                </p>
              )}
            </div>
```

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/shop/CartView.tsx components/shop/CheckoutSummary.tsx
git commit -m "feat(shop): show Preorder badge in cart and checkout summary"
```

---

## Task 11: Checkout server action — skip stock for preorder + snapshot to orderItems

**Files:**
- Modify: `app/actions/shop/checkout.ts:69-114` (variant load + line-item build), `app/actions/shop/checkout.ts:185-195` (orderItems insert)

- [ ] **Step 1: Fetch the new product fields when loading variants**

In `app/actions/shop/checkout.ts`, replace the `db.select(...)` block that loads variants (currently lines 69–82) with:

```typescript
  const variantIds = input.items.map((i) => i.variantId);
  const rows = await db
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      price: productVariants.price,
      stock: productVariants.stockQuantity,
      productName: products.name,
      productStatus: products.status,
      isPreorder: products.isPreorder,
      preorderShipEstimate: products.preorderShipEstimate,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  const byId = new Map(rows.map((r) => [r.variantId, r]));
```

- [ ] **Step 2: Skip the stock check for preorder lines and carry snapshot into `lineItems`**

Replace the `lineItems` typedef + loop (currently lines 86–114) with:

```typescript
  const lineItems: {
    variantId: string;
    productName: string;
    variantName: string;
    unitPrice: number;
    quantity: number;
    isPreorder: boolean;
    preorderShipEstimate: string | null;
  }[] = [];
  for (const item of input.items) {
    const v = byId.get(item.variantId);
    if (!v || v.productStatus !== 'active') {
      return {
        ok: false,
        error: 'An item in your cart is no longer available.',
      };
    }
    if (!v.isPreorder && v.stock < item.quantity) {
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
      isPreorder: v.isPreorder,
      preorderShipEstimate: v.preorderShipEstimate,
    });
  }
```

- [ ] **Step 3: Snapshot fields into the orderItems insert**

Replace the `orderItems` insert (currently lines 185–194) with:

```typescript
      db.insert(orderItems).values(
        lineItems.map((l) => ({
          orderId,
          variantId: l.variantId,
          productName: l.productName,
          variantName: l.variantName,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          isPreorder: l.isPreorder,
          preorderShipEstimate: l.preorderShipEstimate,
        }))
      ),
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/shop/checkout.ts
git commit -m "feat(shop): allow preorder items at checkout and snapshot preorder state on order items"
```

---

## Task 12: OrderSummary + order confirmation email

**Files:**
- Modify: `components/shop/OrderSummary.tsx:3-9` (Item type), `components/shop/OrderSummary.tsx:30-45` (line item rendering)
- Modify: `lib/shop/order-email.ts:105-113` (item row HTML)

- [ ] **Step 1: Extend `OrderSummary` item interface and render preorder pill**

Replace the contents of `components/shop/OrderSummary.tsx` with:

```tsx
import { formatCedis } from '@/lib/shop/money';
import { PreorderBadge } from './PreorderBadge';

interface Item {
  id: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  isPreorder: boolean;
  preorderShipEstimate: string | null;
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
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Items
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-start justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{i.productName}</p>
                {i.isPreorder && <PreorderBadge variant="pill" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {i.variantName} · ×{i.quantity}
              </p>
              {i.isPreorder && i.preorderShipEstimate && (
                <p className="text-xs text-primary">
                  {i.preorderShipEstimate}
                </p>
              )}
            </div>
            <p className="font-semibold tabular-nums">
              {formatCedis(i.unitPrice * i.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatCedis(order.subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>
            Delivery{' '}
            {order.shipRegion && (
              <span className="text-foreground/70">
                ({order.shipRegion})
              </span>
            )}
          </span>
          <span className="tabular-nums">
            {formatCedis(order.deliveryFee)}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCedis(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
```

> Note: `OrderSummary` is consumed by `app/(shop)/shop/checkout/processing/page.tsx`, `app/(shop)/shop/orders/[orderNumber]/page.tsx`, and `app/admin/orders/[id]/page.tsx`. Each loads items with `db.select().from(orderItems).where(...)` (or via `getOrderByNumber` in `lib/shop/orders.ts`), which selects all columns — so the new fields propagate without those pages needing changes. Confirm by running the typecheck in Step 3.

- [ ] **Step 2: Show preorder note in confirmation email line items**

In `lib/shop/order-email.ts`, replace the `itemRows` block (currently lines 105–113) with:

```typescript
  const itemRows = items
    .map((i) => {
      const note = i.isPreorder
        ? `<div style="color:#7a6300;font-size:12px">Preorder${
            i.preorderShipEstimate
              ? ` — ${i.preorderShipEstimate}`
              : ''
          }</div>`
        : '';
      return (
        `<tr><td style="padding:4px 0">${i.productName} (${i.variantName}) × ${i.quantity}${note}</td>` +
        `<td style="text-align:right;padding:4px 0">${formatCedis(
          i.unitPrice * i.quantity
        )}</td></tr>`
      );
    })
    .join('');
```

(The note inherits a gold-tinted colour to match the in-app `Preorder` pill, but renders even in plain email clients as visible text.)

- [ ] **Step 3: Typecheck + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/shop/OrderSummary.tsx lib/shop/order-email.ts
git commit -m "feat(shop): show preorder snapshot in order summary and confirmation email"
```

---

## Task 13: Manual smoke verification

**Files:** none — this is a runtime verification task.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Open the storefront in a browser.

- [ ] **Step 2: Admin — create a preorder product**

1. Sign in as an admin and go to `/admin/products`.
2. Click the new-product control. In the form: enter a name, pick a category if available, add one variant with stock `0`, check the new "This is a preorder product" box, and type `Ships in ~2 weeks` into the ship-estimate input.
3. Set status to `Active` and save.

Verify:
- Saves without error.
- Reopening the product re-hydrates the checkbox and ship estimate.

- [ ] **Step 3: Storefront — verify product page**

Navigate to `/shop/products/<the-new-product-slug>`.

Verify:
- A "Preorder" pill appears in the top-right of the product card on `/shop` and `/shop/products`.
- On the detail page, the gold "Preorder" badge + "Ships in ~2 weeks" text appear above the description (in place of "Currently out of stock").
- The Add-to-Cart button reads "Pre-order" and is enabled even though stock is 0.
- Clicking "Pre-order" adds the item to the cart with no toast error.

- [ ] **Step 4: Storefront — verify cart, checkout, payment, confirmation**

1. Open the cart drawer / `/shop/cart` and confirm the preorder pill + ship estimate are shown under the product name.
2. Go to `/shop/checkout`. Confirm the right-rail summary shows the pill + estimate.
3. Complete a checkout against Paystack's test mode.
4. On the `/shop/checkout/processing` page, confirm the OrderSummary shows the pill + estimate next to the line item.
5. Open the confirmation email in Resend's test inbox (or check the dev mail capture) and confirm the "Preorder — Ships in ~2 weeks" note appears under the line.

- [ ] **Step 5: Regression — non-preorder product**

Open an existing non-preorder product and a known out-of-stock product (set all variants to stock 0 if needed).

Verify:
- Card shows "Sold out" in the corner.
- Detail page shows "Currently out of stock" badge.
- Add-to-Cart button is disabled and reads "Out of stock".

- [ ] **Step 6: Regression — snapshot stability**

In the admin, toggle the preorder product back to non-preorder. Reload the order confirmation page (`/shop/orders/<orderNumber>`).

Verify:
- The line item still shows the "Preorder" pill and the ship estimate — proving the snapshot is being read from `order_items`, not the live product.

- [ ] **Step 7: Commit any small fixes**

If smoke testing surfaces small UI tweaks, fix them and commit:

```bash
git add -p
git commit -m "fix(shop): <specific tweak>"
```

---

## Done

After all tasks: run `npm run lint && npx tsc --noEmit && npm test && npm run build` one final time. Expected: all green.

