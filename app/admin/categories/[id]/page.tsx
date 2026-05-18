import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  if (!category) notFound();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit category</h1>
      <div className="mt-6">
        <CategoryForm
          category={{
            id: category.id,
            name: category.name,
            description: category.description,
          }}
        />
      </div>
    </div>
  );
}
