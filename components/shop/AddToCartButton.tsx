'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatCedis } from '@/lib/shop/money';
import { useCart } from '@/lib/cart-context';

interface Variant {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
}

interface Props {
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  variants: Variant[];
}

export function AddToCartButton({
  productSlug,
  productName,
  imageUrl,
  variants,
}: Props) {
  const { addItem } = useCart();
  const firstAvailable =
    variants.find((v) => v.stockQuantity > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);

  const selected = variants.find((v) => v.id === selectedId);
  const canAdd = !!selected && selected.stockQuantity > 0;

  function add() {
    if (!selected) return;
    addItem({
      variantId: selected.id,
      productSlug,
      productName,
      variantName: selected.name,
      unitPrice: selected.price,
      imageUrl,
    });
    toast.success(`${productName} added to cart`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={v.stockQuantity === 0}
            onClick={() => setSelectedId(v.id)}
            className={cn(
              'flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition-colors',
              v.id === selectedId
                ? 'border-primary bg-accent'
                : 'border-border',
              v.stockQuantity === 0 && 'opacity-50'
            )}>
            <span>
              <span className="font-medium">{v.name}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {v.stockQuantity > 0
                  ? `${v.stockQuantity} in stock`
                  : 'Out of stock'}
              </span>
            </span>
            <span className="font-medium">{formatCedis(v.price)}</span>
          </button>
        ))}
      </div>
      <Button onClick={add} disabled={!canAdd} className="w-full">
        {canAdd ? 'Add to cart' : 'Out of stock'}
      </Button>
    </div>
  );
}
