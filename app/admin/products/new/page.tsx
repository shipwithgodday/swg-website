import { db } from '@/lib/db';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  const categories = await db.query.categories.findMany({
    columns: { id: true, name: true },
    orderBy: (c, { asc }) => asc(c.name),
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">New product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Save the product first, then add images on the edit screen.
      </p>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
