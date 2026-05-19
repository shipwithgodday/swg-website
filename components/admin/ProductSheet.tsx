'use client';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ProductForm, type ProductFormValue } from './ProductForm';

interface Props {
  categories: { id: string; name: string }[];
  /** The product being edited, or undefined when creating a new one. */
  product?: ProductFormValue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Side-panel wrapper that hosts the product create/edit form. */
export function ProductSheet({
  categories,
  product,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle>
            {product ? 'Edit product' : 'New product'}
          </SheetTitle>
          <SheetDescription>
            {product
              ? 'Update details, variants, and images.'
              : 'Add a product with at least one variant.'}
          </SheetDescription>
        </SheetHeader>
        {/* key remounts the form per product so staged-image cleanup runs */}
        <ProductForm
          key={product?.id ?? 'new'}
          categories={categories}
          product={product}
          onSaved={() => {
            onOpenChange(false);
            router.refresh();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
