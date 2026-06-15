import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, orderItems, productVariants } from '@/lib/db/schema';

/** Cache tag for the "most popular" section; busted when an order is paid. */
export const POPULAR_PRODUCTS_TAG = 'popular-products';

export async function getActiveProducts(categoryId?: string) {
  return db.query.products.findMany({
    where: (p, { eq, and }) =>
      categoryId
        ? and(eq(p.status, 'active'), eq(p.categoryId, categoryId))
        : eq(p.status, 'active'),
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
    where: (p, { eq, and }) =>
      and(eq(p.status, 'active'), eq(p.featured, true)),
    with: {
      variants: { orderBy: (v) => asc(v.position) },
      images: { orderBy: (i) => asc(i.position), limit: 1 },
    },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
}

/** Card-shaped projection used by the storefront product grids. */
type ProductCardRow = {
  slug: string;
  name: string;
  isPreorder: boolean;
  images: { url: string }[];
  variants: { price: number; stockQuantity: number }[];
};

function toCardRow(p: {
  slug: string;
  name: string;
  isPreorder: boolean;
  images: { url: string }[];
  variants: { price: number; stockQuantity: number }[];
}): ProductCardRow {
  return {
    slug: p.slug,
    name: p.name,
    isPreorder: p.isPreorder,
    images: p.images.map((i) => ({ url: i.url })),
    variants: p.variants.map((v) => ({
      price: v.price,
      stockQuantity: v.stockQuantity,
    })),
  };
}

const POPULAR_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Take the top `limit` ranked items, padding with `fillers` (skipping ones
 * already present) when there are fewer than `limit`. An empty `ranked` list
 * yields an empty result — the section is hidden rather than backfilled from
 * nothing.
 */
export function padPopular<T extends { slug: string }>(
  ranked: T[],
  fillers: T[],
  limit: number
): T[] {
  if (ranked.length === 0) return [];
  const result = ranked.slice(0, limit);
  const have = new Set(result.map((p) => p.slug));
  for (const f of fillers) {
    if (result.length >= limit) break;
    if (!have.has(f.slug)) {
      result.push(f);
      have.add(f.slug);
    }
  }
  return result;
}

async function queryMostPurchased(limit: number): Promise<ProductCardRow[]> {
  const since = new Date(Date.now() - POPULAR_WINDOW_MS);

  // Rank products by units sold across paid orders in the window.
  const ranked = await db
    .select({
      productId: productVariants.productId,
      units: sql<number>`sum(${orderItems.quantity})`.mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .where(and(eq(orders.status, 'paid'), gte(orders.createdAt, since)))
    .groupBy(productVariants.productId)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(limit * 3);

  let popular: ProductCardRow[] = [];
  if (ranked.length) {
    const rank = new Map(ranked.map((r, i) => [r.productId, i]));
    const ids = ranked.map((r) => r.productId);
    const rows = await db.query.products.findMany({
      where: (p) => and(eq(p.status, 'active'), inArray(p.id, ids)),
      with: {
        variants: { orderBy: (v) => asc(v.position) },
        images: { orderBy: (i) => asc(i.position), limit: 1 },
      },
    });
    popular = rows
      .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
      .slice(0, limit)
      .map(toCardRow);
  }

  // No real purchase history → caller hides the section entirely.
  if (popular.length === 0) return [];
  if (popular.length >= limit) return popular.slice(0, limit);

  // Pad up to `limit` with featured, then newest active products.
  const fillers = await db.query.products.findMany({
    where: (p) => eq(p.status, 'active'),
    with: {
      variants: { orderBy: (v) => asc(v.position) },
      images: { orderBy: (i) => asc(i.position), limit: 1 },
    },
    orderBy: (p) => [desc(p.featured), desc(p.createdAt)],
    limit: limit + popular.length + 5,
  });
  return padPopular(popular, fillers.map(toCardRow), limit);
}

/**
 * Top products by units sold across paid orders in the last 30 days, padded
 * with featured/newest products when there are fewer than `limit` sellers.
 * Returns [] when there is no purchase history (section is then hidden).
 *
 * Cached and tagged so the aggregation doesn't run on every request; the tag
 * is busted from `completeOrder` when a new order is paid.
 */
export function getMostPurchasedProducts(limit = 5): Promise<ProductCardRow[]> {
  return unstable_cache(
    () => queryMostPurchased(limit),
    ['most-purchased', String(limit)],
    { tags: [POPULAR_PRODUCTS_TAG], revalidate: 600 }
  )();
}

// Wrapped in React.cache so the product detail page and its
// generateMetadata share a single DB fetch per request.
export const getProductBySlug = cache(async (slug: string) => {
  return db.query.products.findFirst({
    where: (p, { eq, and }) =>
      and(eq(p.slug, slug), eq(p.status, 'active')),
    with: {
      variants: { orderBy: (v) => asc(v.position) },
      images: { orderBy: (i) => asc(i.position) },
      category: true,
    },
  });
});

export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (c, { asc: a }) => a(c.name),
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, slug),
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
