'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createCategory,
  updateCategory,
  type ActionResult,
} from '@/app/actions/shop/categories';

interface Props {
  category?: { id: string; name: string; description: string | null };
}

export function CategoryForm({ category }: Props) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(
    category?.description ?? ''
  );
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const payload = { name, description: description || null };
      const res: ActionResult = category
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);
      if (res.ok) {
        toast.success(category ? 'Category updated' : 'Category created');
        router.push('/admin/categories');
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save category'}
      </Button>
    </form>
  );
}
