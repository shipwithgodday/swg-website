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
  isPreorder?: boolean;
  preorderShipEstimate?: string | null;
  variants: Variant[];
}

export function AddToCartButton(props: Props) {
  const { productSlug, productName, imageUrl, variants } = props;
  const { addItem, itemCount, subtotal } = useCart();
  const isPreorder = !!props.isPreorder;
  const firstAvailable = isPreorder
    ? variants[0]
    : (variants.find((v) => v.stockQuantity > 0) ?? variants[0]);
  const [selectedId, setSelectedId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);

  const selected = variants.find((v) => v.id === selectedId);
  const max = selected?.stockQuantity ?? 0;
  const canAdd = isPreorder
    ? !!selected && qty > 0
    : !!selected && max > 0 && qty > 0 && qty <= max;

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
        isPreorder,
        preorderShipEstimate: props.preorderShipEstimate ?? null,
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
            {variants.map((v) => {
              const variantDisabled = !isPreorder && v.stockQuantity === 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={variantDisabled}
                  onClick={() => {
                    setSelectedId(v.id);
                    setQty(1);
                  }}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                    v.id === selectedId
                      ? 'border-primary bg-primary text-black'
                      : 'border-border bg-white text-foreground hover:border-foreground/30',
                    variantDisabled &&
                      'cursor-not-allowed opacity-50 line-through'
                  )}>
                  {v.name}
                </button>
              );
            })}
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
              {isPreorder
                ? props.preorderShipEstimate || 'Available to preorder'
                : max > 0
                  ? `${max} in stock`
                  : 'Out of stock'}
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
                setQty((q) =>
                  isPreorder ? Math.min(99, q + 1) : Math.min(max || 1, q + 1)
                )
              }
              className="grid size-10 place-items-center rounded-full hover:bg-accent">
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={add}
          disabled={!canAdd}
          size="lg"
          className="h-14 w-full gap-2.5 text-lg font-semibold">
          <ShoppingCart className="size-5" />
          {isPreorder
            ? 'Pre-order'
            : canAdd
              ? 'Add to cart'
              : 'Out of stock'}
        </Button>

        {itemCount > 0 && (
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground">
            <ShoppingCart className="size-4 text-primary" />
            <span className="tabular-nums">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{formatCedis(subtotal)}</span>
            <span>in your cart</span>
          </p>
        )}
      </div>
    </div>
  );
}
