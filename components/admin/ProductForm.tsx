'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VariantEditor,
  emptyVariant,
  type VariantRow,
} from './VariantEditor';
import {
  createProduct,
  updateProduct,
} from '@/app/actions/shop/products';

type Status = 'draft' | 'active' | 'archived';

interface Props {
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    status: Status;
    featured: boolean;
    variants: VariantRow[];
  };
}

export function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(
    product?.description ?? ''
  );
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? ''
  );
  const [status, setStatus] = useState<Status>(product?.status ?? 'draft');
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants ?? [{ ...emptyVariant }]
  );
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      description: description || null,
      categoryId: categoryId || null,
      status,
      featured,
      variants: variants.map((v) => ({
        name: v.name,
        sku: v.sku || null,
        price: Math.round(parseFloat(v.priceCedis || '0') * 100),
        stockQuantity: parseInt(v.stockQuantity || '0', 10),
      })),
    };
    start(async () => {
      const res = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);
      if (res.ok) {
        toast.success(product ? 'Product updated' : 'Product created');
        router.push('/admin/products');
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v)}>
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as Status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="featured"
          checked={featured}
          onCheckedChange={(c) => setFeatured(c === true)}
        />
        <Label htmlFor="featured">Featured on storefront</Label>
      </div>
      <VariantEditor variants={variants} onChange={setVariants} />
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save product'}
      </Button>
    </form>
  );
}
