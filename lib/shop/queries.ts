import { cache } from 'react';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';

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
