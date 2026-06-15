import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { PageHero } from '@/components/shared/PageHero';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { CategoryFilter } from '@/components/shop/CategoryFilter';
import { MotionReveal } from '@/components/shared/MotionReveal';
import {
  getFeaturedProducts,
  getActiveProducts,
  getMostPurchasedProducts,
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

export default async function ShopPage() {
  const [featured, all, popular, categories] = await Promise.all([
    getFeaturedProducts(),
    getActiveProducts(),
    getMostPurchasedProducts(),
    getCategories(),
  ]);

  return (
    <>
      <PageHero
        title="Shop with Godday"
        highlightedWord="Godday"
        subtitle="Curated essentials sourced and shipped from China to Ghana. Browse, pick your variant, and pay in cedis."
      />

      <Container className="py-12 md:py-16">
        {categories.length > 0 && (
          <MotionReveal>
            <CategoryFilter categories={categories} />
          </MotionReveal>
        )}

        {featured.length > 0 && (
          <section className="mt-12">
            <MotionReveal>
              <SectionHeader highlightedWord="products" size="base">
                Featured products
              </SectionHeader>
            </MotionReveal>
            <div className="mt-6">
              <ProductGrid
                products={featured.map((p) => toCard(p, true))}
              />
            </div>
          </section>
        )}

        {popular.length > 0 && (
          <section className="mt-16">
            <MotionReveal>
              <SectionHeader highlightedWord="popular" size="base">
                Most popular
              </SectionHeader>
            </MotionReveal>
            <div className="mt-6">
              <ProductGrid products={popular.map((p) => toCard(p))} />
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
            <ProductGrid
              products={all.slice(0, 8).map((p) => toCard(p))}
            />
          </div>
        </section>
      </Container>
    </>
  );
}
