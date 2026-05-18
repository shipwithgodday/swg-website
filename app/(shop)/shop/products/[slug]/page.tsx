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
