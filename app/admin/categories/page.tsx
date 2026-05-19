import { db } from '@/lib/db';
import {
  CategoriesTable,
  type AdminCategory,
} from '@/components/admin/CategoriesTable';

export default async function CategoriesPage() {
  const rows = await db.query.categories.findMany({
    with: { products: { columns: { id: true } } },
    orderBy: (c, { asc }) => asc(c.name),
  });

  const categories: AdminCategory[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    slug: c.slug,
    productCount: c.products.length,
  }));

  return <CategoriesTable categories={categories} />;
}
