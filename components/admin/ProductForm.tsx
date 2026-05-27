'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/admin/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select';
import {
  VariantEditor,
  emptyVariant,
  type VariantRow,
} from './VariantEditor';
import {
  ProductImageField,
  type ProductImageRow,
} from './ProductImageField';
import { createProduct, updateProduct } from '@/app/actions/shop/products';
import { discardUploads } from '@/app/actions/shop/images';

type Status = 'draft' | 'active' | 'archived';

export interface ProductFormValue {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  status: Status;
  featured: boolean;
  isPreorder: boolean;
  preorderShipEstimate: string | null;
  variants: VariantRow[];
  images: ProductImageRow[];
}

interface Props {
  categories: { id: string; name: string }[];
  product?: ProductFormValue;
  onSaved: () => void;
  onCancel: () => void;
}

const NO_CATEGORY = 'none';

export function ProductForm({
  categories,
  product,
  onSaved,
  onCancel,
}: Props) {
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(
    product?.description ?? ''
  );
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? NO_CATEGORY
  );
  const [status, setStatus] = useState<Status>(product?.status ?? 'draft');
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [isPreorder, setIsPreorder] = useState(product?.isPreorder ?? false);
  const [preorderShipEstimate, setPreorderShipEstimate] = useState(
    product?.preorderShipEstimate ?? ''
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants ?? [{ ...emptyVariant }]
  );
  const [images, setImages] = useState<ProductImageRow[]>(
    product?.images ?? []
  );
  const [pending, start] = useTransition();

  // Cloudinary public IDs uploaded during this editing session. Any that
  // are not persisted on save are orphans and must be cleaned up.
  const sessionUploads = useRef<Set<string>>(new Set());

  // On unmount without a successful save (cancel, close, Escape), drop
  // every staged upload so no orphaned Cloudinary assets are left.
  useEffect(() => {
    const uploads = sessionUploads.current;
    return () => {
      if (uploads.size > 0) {
        void discardUploads([...uploads]);
      }
    };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      description: description || null,
      categoryId: categoryId === NO_CATEGORY ? null : categoryId,
      status,
      featured,
      isPreorder,
      preorderShipEstimate: isPreorder
        ? (preorderShipEstimate.trim() || null)
        : null,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku || null,
        price: Math.round(parseFloat(v.priceCedis || '0') * 100),
        stockQuantity: parseInt(v.stockQuantity || '0', 10),
      })),
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        publicId: img.publicId,
      })),
    };
    start(async () => {
      const res = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      // Discard uploads that were staged but not part of the saved product.
      const saved = new Set(images.map((img) => img.publicId));
      const orphans = [...sessionUploads.current].filter(
        (id) => !saved.has(id)
      );
      if (orphans.length) void discardUploads(orphans);
      // Clear in place so the unmount cleanup (which captured this same
      // Set) sees nothing left to discard.
      sessionUploads.current.clear();
      toast.success(product ? 'Product updated' : 'Product created');
      onSaved();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Name</Label>
          <Input
            id="product-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-description">Description</Label>
          <Textarea
            id="product-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>No category</SelectItem>
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
            id="product-featured"
            checked={featured}
            onCheckedChange={(c) => setFeatured(c === true)}
          />
          <Label htmlFor="product-featured">Featured on storefront</Label>
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="product-preorder"
              checked={isPreorder}
              onCheckedChange={(c) => setIsPreorder(c === true)}
            />
            <Label htmlFor="product-preorder">
              This is a preorder product
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Customers can always order this product, regardless of variant
            stock. Variant stock numbers are still tracked but are not
            enforced at checkout.
          </p>
          {isPreorder && (
            <div className="space-y-2">
              <Label htmlFor="product-preorder-ship">
                Expected ship estimate (optional)
              </Label>
              <Input
                id="product-preorder-ship"
                value={preorderShipEstimate}
                onChange={(e) => setPreorderShipEstimate(e.target.value)}
                placeholder='e.g. "Ships in ~2 weeks" or "Expected mid-June"'
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                Shown to customers on the product page, cart, and order
                confirmation. Leave blank to omit.
              </p>
            </div>
          )}
        </div>
        <VariantEditor variants={variants} onChange={setVariants} />
        <ProductImageField
          images={images}
          onChange={setImages}
          onUploaded={(publicId) => sessionUploads.current.add(publicId)}
        />
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? 'Saving…' : 'Save product'}
        </Button>
      </div>
    </form>
  );
}
