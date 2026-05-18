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
