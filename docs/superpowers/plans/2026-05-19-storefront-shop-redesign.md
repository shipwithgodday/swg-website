# Storefront Shop Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the storefront shop pages (`/shop/*`) to match the marketing aesthetic — `SectionHeader` with gold highlights, `rounded-2xl` cards, framer-motion fade-up stagger on scroll, polished cart/checkout/orders surfaces.

**Architecture:** Reuse existing primitives (`Container`, `SectionHeader`, marketing `Button`). Add a small `<MotionReveal>` wrapper standardising the fade-up pattern. Touch each shop page and the four shop components (`ProductCard`, `CategoryFilter`, `ProductGallery`, `AddToCartButton`, `CartView`, `OrderSummary`, `OrderStatusBadge`, `CheckoutForm`) to the same language. Server-vs-client boundaries unchanged.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, framer-motion (already installed), Drizzle, Clerk.

---

## Conventions

- Run from `/Users/joel/Documents/lucky-godday` with **pnpm**.
- Type-check with `npx tsc --noEmit`; lint with `pnpm lint`; build with `pnpm build`.
- Branch: `feature/shop` — commit there.
- Working tree has unrelated WIP — `git add` ONLY the files each task names.

---

## Task 1: MotionReveal helper

Standardise the marketing fade-up so every shop section uses the same timing. Used by every later task.

**Files:**
- Create: `components/shop/MotionReveal.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Standard scroll-triggered fade-up used across the storefront. Mirrors the
 * Hero / Services / WhyUs pattern but accepts a stagger index so grids can
 * cascade their children without each callsite re-declaring variants.
 *
 * Respects `prefers-reduced-motion` — when set, content renders statically
 * with no animation.
 */
export function MotionReveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  /** Seconds. Use `index * 0.05` for staggered grid children. */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  if (reduce) {
    const Plain = as as keyof React.JSX.IntrinsicElements;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      className={className}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/MotionReveal.tsx
git commit -m "feat(shop): add MotionReveal scroll fade-up helper"
```

---

## Task 2: ProductCard polish

**Files:**
- Modify: `components/shop/ProductCard.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { formatCedis } from '@/lib/shop/money';
import { displayPrice, inStock } from '@/lib/shop/queries';

export interface ProductCardData {
  slug: string;
  name: string;
  imageUrl: string | null;
  variants: { price: number; stockQuantity: number }[];
  /** When true, shows a small gold "Featured" badge. */
  featured?: boolean;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const available = inStock(product.variants);
  return (
    <Link
      href={`/shop/products/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {product.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm">
            <Sparkles className="size-3" />
            Featured
          </span>
        )}
        {!available && (
          <span className="absolute top-3 right-3 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Sold out
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        <p className="line-clamp-2 font-medium text-foreground">
          {product.name}
        </p>
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {formatCedis(displayPrice(product.variants))}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/ProductCard.tsx
git commit -m "feat(shop): polish ProductCard with rounded-2xl, hover lift, featured pill"
```

---

## Task 3: CategoryFilter polish

Pill row with a distinct active state, horizontal scroll on mobile so it never wraps, and reuse on both `/shop` and `/shop/products`.

**Files:**
- Modify: `components/shop/CategoryFilter.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

```tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CategoryFilter({
  categories,
  activeSlug,
  /** Where the "All" tab should link to. */
  allHref = '/shop/products',
}: {
  categories: { id: string; name: string; slug: string }[];
  activeSlug?: string;
  allHref?: string;
}) {
  const pill =
    'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors';
  return (
    <div
      className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="navigation"
      aria-label="Categories">
      <Link
        href={allHref}
        className={cn(
          pill,
          !activeSlug
            ? 'border-primary bg-primary text-black'
            : 'border-border text-foreground hover:border-foreground/30 hover:bg-accent'
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
              ? 'border-primary bg-primary text-black'
              : 'border-border text-foreground hover:border-foreground/30 hover:bg-accent'
          )}>
          {c.name}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/CategoryFilter.tsx
git commit -m "feat(shop): polish CategoryFilter with active pill and mobile scroll"
```

---

## Task 4: `/shop` landing

**Files:**
- Modify: `app/(shop)/shop/page.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

```tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { CategoryFilter } from '@/components/shop/CategoryFilter';
import { MotionReveal } from '@/components/shop/MotionReveal';
import {
  getFeaturedProducts,
  getActiveProducts,
  getCategories,
} from '@/lib/shop/queries';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse products from Ship With Godday.',
};

function toCard(
  p: {
    slug: string;
    name: string;
    images: { url: string }[];
    variants: { price: number; stockQuantity: number }[];
  },
  featured = false
) {
  return {
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    variants: p.variants,
    featured,
  };
}

export default async function ShopPage() {
  const [featured, all, categories] = await Promise.all([
    getFeaturedProducts(),
    getActiveProducts(),
    getCategories(),
  ]);

  return (
    <Container className="py-12 md:py-16">
      <MotionReveal as="section" className="max-w-3xl">
        <SectionHeader highlightedWord="Godday" size="lg">
          Shop with Godday
        </SectionHeader>
        <p className="mt-3 text-lg font-light text-muted-foreground">
          Curated essentials sourced and shipped from China to Ghana.
          Browse, pick your variant, and pay in cedis.
        </p>
      </MotionReveal>

      {categories.length > 0 && (
        <MotionReveal className="mt-8" delay={0.05}>
          <CategoryFilter categories={categories} />
        </MotionReveal>
      )}

      {featured.length > 0 && (
        <section className="mt-16">
          <MotionReveal>
            <SectionHeader highlightedWord="products" size="base">
              Featured products
            </SectionHeader>
          </MotionReveal>
          <div className="mt-6">
            <ProductGrid products={featured.map((p) => toCard(p, true))} />
          </div>
        </section>
      )}

      <section className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <MotionReveal>
            <SectionHeader highlightedWord="products" size="base">
              All products
            </SectionHeader>
          </MotionReveal>
          <Link
            href="/shop/products"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6">
          <ProductGrid products={all.slice(0, 8).map((p) => toCard(p))} />
        </div>
      </section>
    </Container>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add 'app/(shop)/shop/page.tsx'
git commit -m "feat(shop): redesign /shop landing with section headers and motion"
```

---

## Task 5: `/shop/products` list

**Files:**
- Modify: `app/(shop)/shop/products/page.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

```tsx
import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { CategoryFilter } from '@/components/shop/CategoryFilter';
import { MotionReveal } from '@/components/shop/MotionReveal';
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
    <Container className="py-12 md:py-16">
      <MotionReveal as="section" className="max-w-3xl">
        <SectionHeader
          highlightedWord={activeCategory ? activeCategory.name : 'products'}
          size="lg">
          {activeCategory ? `${activeCategory.name}` : 'Our products'}
        </SectionHeader>
        <p className="mt-3 text-lg font-light text-muted-foreground">
          {activeCategory
            ? `Everything we currently stock in ${activeCategory.name.toLowerCase()}.`
            : 'The full catalog, fresh from the warehouse.'}
        </p>
      </MotionReveal>

      <MotionReveal className="mt-8" delay={0.05}>
        <CategoryFilter
          categories={categories}
          activeSlug={activeCategory?.slug}
        />
      </MotionReveal>

      <div className="mt-10">
        {products.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white p-8 text-center text-muted-foreground">
            Nothing here yet. Check back soon.
          </p>
        ) : (
          <ProductGrid
            products={products.map((p) => ({
              slug: p.slug,
              name: p.name,
              imageUrl: p.images[0]?.url ?? null,
              variants: p.variants,
            }))}
          />
        )}
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add 'app/(shop)/shop/products/page.tsx'
git commit -m "feat(shop): redesign /shop/products with section header and motion"
```

---

## Task 6: ProductGallery + AddToCartButton polish

**Files:**
- Modify: `components/shop/ProductGallery.tsx` (rewrite)
- Modify: `components/shop/AddToCartButton.tsx` (rewrite)

- [ ] **Step 1: Replace `ProductGallery.tsx`**

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
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        No image
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
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
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                'relative size-20 shrink-0 overflow-hidden rounded-xl ring-1 transition-all',
                i === active
                  ? 'ring-2 ring-primary'
                  : 'ring-border opacity-70 hover:opacity-100'
              )}>
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace `AddToCartButton.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
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
  const [qty, setQty] = useState(1);

  const selected = variants.find((v) => v.id === selectedId);
  const max = selected?.stockQuantity ?? 0;
  const canAdd = !!selected && max > 0 && qty > 0 && qty <= max;

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
      });
    }
    toast.success(`${productName} added to cart`);
  }

  return (
    <div className="space-y-5">
      {variants.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Variant
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stockQuantity === 0}
                onClick={() => {
                  setSelectedId(v.id);
                  setQty(1);
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  v.id === selectedId
                    ? 'border-primary bg-primary text-black'
                    : 'border-border bg-white text-foreground hover:border-foreground/30',
                  v.stockQuantity === 0 &&
                    'cursor-not-allowed opacity-50 line-through'
                )}>
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

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
              {max > 0 ? `${max} in stock` : 'Out of stock'}
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
                setQty((q) => Math.min(max || 1, q + 1))
              }
              className="grid size-10 place-items-center rounded-full hover:bg-accent">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Button
        onClick={add}
        disabled={!canAdd}
        className="w-full gap-2 text-base">
        <ShoppingCart className="size-4" />
        {canAdd ? 'Add to cart' : 'Out of stock'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/ProductGallery.tsx components/shop/AddToCartButton.tsx
git commit -m "feat(shop): polish product gallery and variant/qty controls"
```

---

## Task 7: Product detail page + related rail

**Files:**
- Modify: `app/(shop)/shop/products/[slug]/page.tsx` (rewrite)

The related rail reuses `ProductCard`. It is fetched server-side via existing `getActiveProducts(categoryId)`, filtering out the current product, taking up to 4.

- [ ] **Step 1: Replace the file**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, Truck, RotateCcw, Headphones } from 'lucide-react';
import Link from 'next/link';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { MotionReveal } from '@/components/shop/MotionReveal';
import {
  getProductBySlug,
  getActiveProducts,
  inStock,
} from '@/lib/shop/queries';

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

  const related = product.category
    ? (await getActiveProducts(product.category.id))
        .filter((p) => p.slug !== product.slug)
        .slice(0, 4)
    : [];

  return (
    <Container className="py-10 md:py-14">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/shop" className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="size-3.5" />
        {product.category && (
          <>
            <Link
              href={`/shop/products?category=${product.category.slug}`}
              className="hover:text-foreground">
              {product.category.name}
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <MotionReveal>
          <ProductGallery
            images={product.images.map((i) => ({ id: i.id, url: i.url }))}
            name={product.name}
          />
        </MotionReveal>

        <MotionReveal delay={0.1} className="flex flex-col">
          {product.category && (
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              {product.category.name}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            {product.name}
          </h1>
          {!available && (
            <p className="mt-3 inline-flex w-fit rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
              Currently out of stock
            </p>
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
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: v.price,
                stockQuantity: v.stockQuantity,
              }))}
            />
          </div>

          <ul className="mt-8 grid gap-3 rounded-2xl border border-border bg-muted/40 p-5 sm:grid-cols-3">
            <li className="flex items-center gap-2.5 text-sm">
              <Truck className="size-4 text-primary" />
              <span>Delivery across Ghana</span>
            </li>
            <li className="flex items-center gap-2.5 text-sm">
              <RotateCcw className="size-4 text-primary" />
              <span>Hassle-free returns</span>
            </li>
            <li className="flex items-center gap-2.5 text-sm">
              <Headphones className="size-4 text-primary" />
              <Link href="/contact" className="hover:underline">
                Talk to us
              </Link>
            </li>
          </ul>
        </MotionReveal>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <MotionReveal>
            <SectionHeader highlightedWord="like" size="base">
              You may also like
            </SectionHeader>
          </MotionReveal>
          <div className="mt-6">
            <ProductGrid
              products={related.map((p) => ({
                slug: p.slug,
                name: p.name,
                imageUrl: p.images[0]?.url ?? null,
                variants: p.variants,
              }))}
            />
          </div>
        </section>
      )}
    </Container>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add 'app/(shop)/shop/products/[slug]/page.tsx'
git commit -m "feat(shop): redesign product detail with gallery, info strip, related rail"
```

---

## Task 8: CartView polish

**Files:**
- Modify: `components/shop/CartView.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

```tsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';
import { Button } from '@/components/ui/button';

export function CartView({ onNavigate }: { onNavigate?: () => void }) {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-white text-muted-foreground shadow-sm">
          <ShoppingCart className="size-5" />
        </span>
        <p className="font-medium">Your cart is empty</p>
        <p className="text-sm text-muted-foreground">
          Add a few products to see them here.
        </p>
        <Button asChild className="mt-2">
          <Link href="/shop" onClick={onNavigate}>
            Browse products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
        {items.map((i) => (
          <li key={i.variantId} className="flex gap-3 p-3 sm:p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:size-20">
              {i.imageUrl && (
                <Image
                  src={i.imageUrl}
                  alt={i.productName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/shop/products/${i.productSlug}`}
                onClick={onNavigate}
                className="line-clamp-1 text-sm font-medium hover:underline">
                {i.productName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {i.variantName}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      setQuantity(i.variantId, Math.max(1, i.quantity - 1))
                    }
                    className="grid size-7 place-items-center rounded-full hover:bg-accent">
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold tabular-nums">
                    {i.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity(i.variantId, i.quantity + 1)
                    }
                    className="grid size-7 place-items-center rounded-full hover:bg-accent">
                    <Plus className="size-3" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => removeItem(i.variantId)}
                  className="text-muted-foreground transition-colors hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="self-start text-sm font-semibold tabular-nums">
              {formatCedis(i.unitPrice * i.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCedis(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCedis(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Delivery is calculated at checkout.
        </p>
        <Button asChild className="mt-4 w-full">
          <Link href="/shop/checkout" onClick={onNavigate}>
            Checkout
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/CartView.tsx
git commit -m "feat(shop): polish cart with thumbnails, qty stepper, summary card"
```

---

## Task 9: `/shop/cart` page

**Files:**
- Modify: `app/(shop)/shop/cart/page.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

```tsx
import type { Metadata } from 'next';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { CartView } from '@/components/shop/CartView';
import { MotionReveal } from '@/components/shop/MotionReveal';

export const metadata: Metadata = { title: 'Cart' };

export default function CartPage() {
  return (
    <Container className="py-12 md:py-16">
      <MotionReveal className="max-w-3xl">
        <SectionHeader highlightedWord="cart" size="lg">
          Your cart
        </SectionHeader>
        <p className="mt-3 text-lg font-light text-muted-foreground">
          Review your items before heading to checkout.
        </p>
      </MotionReveal>
      <MotionReveal className="mt-8 max-w-2xl" delay={0.1}>
        <CartView />
      </MotionReveal>
    </Container>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add 'app/(shop)/shop/cart/page.tsx'
git commit -m "feat(shop): redesign /shop/cart page header"
```

---

## Task 10: Checkout — two-column layout with sticky summary

**Files:**
- Create: `components/shop/CheckoutSummary.tsx`
- Modify: `components/shop/CheckoutForm.tsx` (rewrite — same submit logic, polished markup)
- Modify: `app/(shop)/shop/checkout/page.tsx` (rewrite)

- [ ] **Step 1: Create `CheckoutSummary.tsx`**

```tsx
'use client';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';

/** Right-rail summary that mirrors the cart with totals incl. delivery. */
export function CheckoutSummary({ deliveryFee }: { deliveryFee: number }) {
  const { items, subtotal } = useCart();
  const total = subtotal + deliveryFee;
  return (
    <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm md:sticky md:top-32">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Order summary
      </h2>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.variantId} className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              {i.imageUrl && (
                <Image
                  src={i.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">
                {i.productName}
              </p>
              <p className="text-xs text-muted-foreground">
                {i.variantName} · ×{i.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {formatCedis(i.unitPrice * i.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCedis(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery</span>
          <span className="tabular-nums">{formatCedis(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCedis(total)}</span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Replace `CheckoutForm.tsx`**

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
import { CheckoutSummary } from '@/components/shop/CheckoutSummary';

interface Zone {
  id: string;
  name: string;
  fee: number;
}

export function CheckoutForm({ zones }: { zones: Zone[] }) {
  const { items } = useCart();
  const [zoneId, setZoneId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pending, start] = useTransition();

  const zone = zones.find((z) => z.id === zoneId);
  const deliveryFee = zone?.fee ?? 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    if (!zoneId) {
      toast.error('Pick a delivery region.');
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
    return (
      <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-muted-foreground">
        Your cart is empty.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
      <div className="space-y-8">
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Delivery details
          </h2>
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
            <Label htmlFor="city">City / town</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Region & delivery fee
          </h2>
          <div className="space-y-2">
            <Label htmlFor="zone">Region</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger id="zone">
                <SelectValue placeholder="Pick your region" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name} · {formatCedis(z.fee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <Button
          type="submit"
          disabled={pending}
          className="w-full text-base">
          {pending ? 'Redirecting to payment…' : 'Pay with Paystack'}
        </Button>
      </div>

      <CheckoutSummary deliveryFee={deliveryFee} />
    </form>
  );
}
```

- [ ] **Step 3: Replace the page**

```tsx
import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { db } from '@/lib/db';
import { deliveryZones } from '@/lib/db/schema';
import { CheckoutForm } from '@/components/shop/CheckoutForm';
import { MotionReveal } from '@/components/shop/MotionReveal';

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
    <Container className="py-12 md:py-16">
      <MotionReveal className="max-w-3xl">
        <SectionHeader highlightedWord="there" size="lg">
          Almost there
        </SectionHeader>
        <p className="mt-3 text-lg font-light text-muted-foreground">
          A few details and we&apos;ll get your order on its way.
        </p>
      </MotionReveal>
      <MotionReveal className="mt-10" delay={0.1}>
        <CheckoutForm zones={zones} />
      </MotionReveal>
    </Container>
  );
}
```

- [ ] **Step 4: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/CheckoutSummary.tsx components/shop/CheckoutForm.tsx 'app/(shop)/shop/checkout/page.tsx'
git commit -m "feat(shop): redesign checkout with sticky summary and section cards"
```

---

## Task 11: OrderStatusBadge tone polish

**Files:**
- Modify: `components/shop/OrderStatusBadge.tsx` (rewrite)

Match the admin `StatusBadge` tone palette so order status colours read the same on both sides.

- [ ] **Step 1: Replace the file**

```tsx
import { cn } from '@/lib/utils';
import { formatOrderStatus } from '@/lib/shop/status-format';

const TONES: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  paid: 'bg-sky-50 text-sky-700 ring-sky-200',
  processing: 'bg-amber-50 text-amber-800 ring-amber-200',
  shipped: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

const FALLBACK = 'bg-zinc-100 text-zinc-700 ring-zinc-200';

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[status] ?? FALLBACK
      )}>
      {formatOrderStatus(status)}
    </span>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/OrderStatusBadge.tsx
git commit -m "feat(shop): match OrderStatusBadge tones with admin StatusBadge"
```

---

## Task 12: Orders list

**Files:**
- Modify: `app/(shop)/shop/orders/page.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import { ArrowRight, Package } from 'lucide-react';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { MotionReveal } from '@/components/shop/MotionReveal';
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
    <Container className="py-12 md:py-16">
      <MotionReveal className="max-w-3xl">
        <SectionHeader highlightedWord="orders" size="lg">
          Your orders
        </SectionHeader>
        {customer && (
          <p className="mt-3 text-lg font-light text-muted-foreground">
            Shipping mark{' '}
            <span className="font-semibold text-foreground">
              {customer.shippingMark}
            </span>
          </p>
        )}
      </MotionReveal>

      <MotionReveal className="mt-10" delay={0.05}>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-white text-muted-foreground shadow-sm">
              <Package className="size-5" />
            </span>
            <p className="font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              When you place an order it&apos;ll show up here.
            </p>
            <Link
              href="/shop"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
              Browse the shop <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/shop/orders/${o.orderNumber}`}
                  className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-accent/40 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(o.createdAt), 'd MMM yyyy')}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                  <p className="w-28 text-right font-semibold tabular-nums">
                    {formatCedis(o.total)}
                  </p>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </MotionReveal>
    </Container>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add 'app/(shop)/shop/orders/page.tsx'
git commit -m "feat(shop): redesign orders list with card layout and empty state"
```

---

## Task 13: Order detail with status timeline

**Files:**
- Create: `components/shop/OrderStatusTimeline.tsx`
- Modify: `app/(shop)/shop/orders/[orderNumber]/page.tsx` (rewrite)

- [ ] **Step 1: Create `OrderStatusTimeline.tsx`**

```tsx
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'paid', label: 'Paid' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const;

const STEP_INDEX: Record<string, number> = {
  pending: -1,
  paid: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

/**
 * Horizontal status timeline. Cancelled orders short-circuit to a single
 * destructive note; everything else lights up steps up to the current status.
 */
export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
        This order was cancelled.
      </p>
    );
  }
  const current = STEP_INDEX[status] ?? -1;
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {STEPS.map((step, i) => {
        const reached = i <= current;
        const isLast = i === STEPS.length - 1;
        return (
          <li
            key={step.key}
            className="flex flex-1 items-center gap-3 min-w-[8rem]">
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full ring-1',
                reached
                  ? 'bg-primary text-black ring-primary'
                  : 'bg-white text-muted-foreground ring-border'
              )}>
              {reached ? (
                <Check className="size-4" />
              ) : (
                <span className="text-xs font-semibold tabular-nums">
                  {i + 1}
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                reached ? 'text-foreground' : 'text-muted-foreground'
              )}>
              {step.label}
            </span>
            {!isLast && (
              <span
                className={cn(
                  'mx-2 h-px flex-1',
                  reached ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 2: Replace the page**

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { OrderStatusTimeline } from '@/components/shop/OrderStatusTimeline';
import { MotionReveal } from '@/components/shop/MotionReveal';
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

  const { userId } = await auth();
  const customer = userId ? await getCustomerByClerkId(userId) : null;
  if (!customer || customer.id !== order.customerId) notFound();

  return (
    <Container className="py-10 md:py-14">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/shop/orders" className="hover:text-foreground">
          Orders
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{order.orderNumber}</span>
      </nav>

      <MotionReveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionHeader highlightedWord={order.orderNumber} size="base">
              Order {order.orderNumber}
            </SectionHeader>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed {format(new Date(order.createdAt), 'd MMM yyyy')}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </MotionReveal>

      <MotionReveal className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6" delay={0.05}>
        <OrderStatusTimeline status={order.status} />
      </MotionReveal>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
        <MotionReveal delay={0.1}>
          <OrderSummary order={order} items={items} />
        </MotionReveal>
        <MotionReveal delay={0.15}>
          <div className="rounded-2xl border border-border bg-white p-5 text-sm shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Delivery
            </p>
            <p className="mt-2 font-medium">{order.shipName}</p>
            <p className="text-muted-foreground">
              {order.shipAddress}
              <br />
              {order.shipCity}, {order.shipRegion}
              <br />
              {order.shipPhone}
            </p>
          </div>
        </MotionReveal>
      </div>
    </Container>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/OrderStatusTimeline.tsx 'app/(shop)/shop/orders/[orderNumber]/page.tsx'
git commit -m "feat(shop): order detail with status timeline and split layout"
```

---

## Task 14: Polish OrderSummary card

**Files:**
- Modify: `components/shop/OrderSummary.tsx` (rewrite)

- [ ] **Step 1: Replace the file**

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
              <p className="font-medium">{i.productName}</p>
              <p className="text-xs text-muted-foreground">
                {i.variantName} · ×{i.quantity}
              </p>
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

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/shop/OrderSummary.tsx
git commit -m "feat(shop): polish OrderSummary as a card with item list"
```

---

## Task 15: Final verification

- [ ] **Step 1: Tests**

```bash
pnpm test
```
Expected: PASS — all 57 tests green (no test files added by this redesign).

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Lint**

```bash
pnpm lint
```
Expected: clean.

- [ ] **Step 4: Build**

```bash
pnpm build
```
Expected: success.

- [ ] **Step 5: Manual visual pass**

Start `pnpm dev` and walk:
- `/shop` — section headers gold-highlighted, category pills with active state, motion fade-up on scroll, ProductCards rounded-2xl with hover lift, Featured pill on featured items.
- `/shop/products` and `/shop/products?category=…` — filter pill shows active state, title updates.
- A product detail page — breadcrumb, gallery with thumbnails, variant pills + quantity stepper, info strip, related rail.
- Cart drawer (cart icon in navbar) — thumbnails, qty steppers, sticky-feel summary.
- `/shop/cart` — same content, page-level header.
- `/shop/checkout` — two-column with sticky summary on desktop; stacked on mobile.
- `/shop/orders` — card-list layout; empty state if signed-in with no orders.
- `/shop/orders/[orderNumber]` — breadcrumb, status timeline (lit steps in gold), items + delivery cards.

- [ ] **Step 6: Storefront-redesign-only check**

```bash
git diff --name-only main -- components/admin app/admin lib/shop/admin-dashboard.ts
```
Expected: only admin files that were already changed in the admin redesign — no new admin paths touched by this storefront pass.

---

## Notes for the implementer

- **Use marketing primitives.** `SectionHeader` (gold-highlighted word), `Container` (`max-w-screen-xl` + `px-8 xl:px-0`), the storefront `Button` (gold pill with `hover:scale-105`) — these are the canon. Don't introduce new wrappers.
- **One motion pattern.** Use `MotionReveal` (Task 1) everywhere; don't sprinkle ad-hoc framer-motion at call sites.
- **Cart context is untouched.** `useCart()` API stays the same. Cart provider lives in the root layout — don't move it.
- **Intermediate task state is fine.** Each task should leave the app type-checking and building; do not skip the `npx tsc --noEmit` before committing.
- **No admin or storefront-marketing files should change** in this redesign. Only files explicitly listed under each task.
