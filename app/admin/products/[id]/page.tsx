import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.id, id),
    with: {
      variants: { orderBy: (v, { asc }) => asc(v.position) },
      images: { orderBy: (i, { asc }) => asc(i.position) },
    },
  });
  if (!product) notFound();

  const categories = await db.query.categories.findMany({
    columns: { id: true, name: true },
    orderBy: (c, { asc }) => asc(c.name),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          status: product.status as 'draft' | 'active' | 'archived',
          featured: product.featured,
          variants: product.variants.map((v) => ({
            name: v.name,
            sku: v.sku ?? '',
            priceCedis: (v.price / 100).toFixed(2),
            stockQuantity: String(v.stockQuantity),
          })),
        }}
      />
      <ImageUploader
        productId={product.id}
        images={product.images.map((i) => ({ id: i.id, url: i.url }))}
      />
    </div>
  );
}
