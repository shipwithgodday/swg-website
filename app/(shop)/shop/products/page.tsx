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
