'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';
import { Button } from '@/components/ui/button';
import { PreorderBadge } from './PreorderBadge';

export function CartView({ onNavigate }: { onNavigate?: () => void }) {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-white text-muted-foreground shadow-sm">
          <ShoppingCart className="size-5" />
        </span>
        <p className="font-medium">Your cart is empty</p>
        <p className="text-sm text-muted-foreground">
          Add a few products to see them here.
        </p>
        <Button asChild className="mt-2">
          <Link href="/shop" onClick={onNavigate}>
            Browse products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-border rounded-2xl border border-border bg-white">
        {items.map((i) => (
          <li key={i.variantId} className="flex gap-3 p-3 sm:p-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border sm:size-20">
              {i.imageUrl && (
                <Image
                  src={i.imageUrl}
                  alt={i.productName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/shop/products/${i.productSlug}`}
                  onClick={onNavigate}
                  className="line-clamp-1 text-sm font-medium hover:underline">
                  {i.productName}
                </Link>
                {i.isPreorder && <PreorderBadge variant="pill" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {i.variantName}
              </p>
              {i.isPreorder && i.preorderShipEstimate && (
                <p className="text-xs text-primary">
                  {i.preorderShipEstimate}
                </p>
              )}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      setQuantity(i.variantId, Math.max(1, i.quantity - 1))
                    }
                    className="grid size-7 place-items-center rounded-full hover:bg-accent">
                    <Minus className="size-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold tabular-nums">
                    {i.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() =>
                      setQuantity(i.variantId, i.quantity + 1)
                    }
                    className="grid size-7 place-items-center rounded-full hover:bg-accent">
                    <Plus className="size-3" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => removeItem(i.variantId)}
                  className="text-muted-foreground transition-colors hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="self-start text-sm font-semibold tabular-nums">
              {formatCedis(i.unitPrice * i.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCedis(subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCedis(subtotal)}</span>
        </div>
        <Button asChild className="mt-4 w-full">
          <Link href="/shop/checkout" onClick={onNavigate}>
            Checkout
          </Link>
        </Button>
      </div>
    </div>
  );
}
