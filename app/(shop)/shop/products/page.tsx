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
