import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChevronRight, Truck, RotateCcw, Headphones } from 'lucide-react';
import Link from 'next/link';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { MotionReveal } from '@/components/shared/MotionReveal';
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
