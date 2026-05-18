'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';
import { Button } from '@/components/ui/button';

export function CartView({ onNavigate }: { onNavigate?: () => void }) {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">Your cart is empty.</p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((i) => (
        <div key={i.variantId} className="flex gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {i.imageUrl && (
              <Image
                src={i.imageUrl}
                alt={i.productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/shop/products/${i.productSlug}`}
              onClick={onNavigate}
              className="text-sm font-medium hover:underline">
              {i.productName}
            </Link>
            <p className="text-xs text-muted-foreground">
              {i.variantName}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={i.quantity}
                onChange={(e) =>
                  setQuantity(
                    i.variantId,
                    parseInt(e.target.value || '1', 10)
                  )
                }
                className="h-8 w-16 rounded-md border border-input px-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(i.variantId)}
                className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <p className="text-sm font-medium">
            {formatCedis(i.unitPrice * i.quantity)}
          </p>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="font-medium">Subtotal</span>
        <span className="font-medium">{formatCedis(subtotal)}</span>
      </div>
      <Button asChild className="w-full">
        <Link href="/shop/checkout" onClick={onNavigate}>
          Checkout
        </Link>
      </Button>
    </div>
  );
}
