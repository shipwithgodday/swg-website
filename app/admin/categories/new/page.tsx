import { CategoryForm } from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">New category</h1>
      <div className="mt-6">
        <CategoryForm />
      </div>
    </div>
  );
}
