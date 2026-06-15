'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/admin/ui/textarea';
import {
  createCategory,
  updateCategory,
  type ActionResult,
} from '@/app/actions/shop/categories';

export interface CategoryFormValue {
  id: string;
  name: string;
  description: string | null;
}

interface Props {
  category?: CategoryFormValue;
  onSaved: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSaved, onCancel }: Props) {
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
        onSaved();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category-description">Description</Label>
        <Textarea
          id="category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" disabled={pending || !name.trim()}>
          {pending ? 'Saving…' : 'Save category'}
        </Button>
      </div>
    </form>
  );
}
