'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
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
  const [qty, setQty] = useState(1);

  const selected = variants.find((v) => v.id === selectedId);
  const max = selected?.stockQuantity ?? 0;
  const canAdd = !!selected && max > 0 && qty > 0 && qty <= max;

  function add() {
    if (!selected) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        variantId: selected.id,
        productSlug,
        productName,
        variantName: selected.name,
        unitPrice: selected.price,
        imageUrl,
      });
    }
    toast.success(`${productName} added to cart`);
  }

  return (
    <div className="space-y-5">
      {variants.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Variant
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stockQuantity === 0}
                onClick={() => {
                  setSelectedId(v.id);
                  setQty(1);
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  v.id === selectedId
                    ? 'border-primary bg-primary text-black'
                    : 'border-border bg-white text-foreground hover:border-foreground/30',
                  v.stockQuantity === 0 &&
                    'cursor-not-allowed opacity-50 line-through'
                )}>
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Price
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {formatCedis(selected.price)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {max > 0 ? `${max} in stock` : 'Out of stock'}
            </p>
          </div>
          <div className="flex items-center rounded-full border border-border bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="grid size-10 place-items-center rounded-full hover:bg-accent">
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() =>
                setQty((q) => Math.min(max || 1, q + 1))
              }
              className="grid size-10 place-items-center rounded-full hover:bg-accent">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Button
        onClick={add}
        disabled={!canAdd}
        className="w-full gap-2 text-base">
        <ShoppingCart className="size-4" />
        {canAdd ? 'Add to cart' : 'Out of stock'}
      </Button>
    </div>
  );
}
