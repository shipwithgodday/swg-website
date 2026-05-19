import { Suspense } from 'react';
import { db } from '@/lib/db';
import { ProductsTable, type AdminProduct } from '@/components/admin/ProductsTable';

export default async function ProductsPage() {
  const [rows, categories] = await Promise.all([
    db.query.products.findMany({
      with: {
        category: { columns: { name: true } },
        variants: { orderBy: (v, { asc }) => asc(v.position) },
        images: { orderBy: (i, { asc }) => asc(i.position) },
      },
      orderBy: (p, { desc }) => desc(p.createdAt),
    }),
    db.query.categories.findMany({
      columns: { id: true, name: true },
      orderBy: (c, { asc }) => asc(c.name),
    }),
  ]);

  const products: AdminProduct[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    status: p.status as AdminProduct['status'],
    featured: p.featured,
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku ?? '',
      priceCedis: (v.price / 100).toFixed(2),
      stockQuantity: String(v.stockQuantity),
    })),
    images: p.images.map((i) => ({
      id: i.id,
      url: i.url,
      publicId: i.publicId,
    })),
  }));

  // Suspense boundary required: ProductsTable reads useSearchParams.
  return (
    <Suspense>
      <ProductsTable products={products} categories={categories} />
    </Suspense>
  );
}
