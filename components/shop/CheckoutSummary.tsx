'use client';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';
import { PreorderBadge } from './PreorderBadge';

/** Right-rail summary that mirrors the cart with totals incl. delivery. */
export function CheckoutSummary({ deliveryFee }: { deliveryFee: number }) {
  const { items, subtotal } = useCart();
  const total = subtotal + deliveryFee;
  return (
    <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm md:sticky md:top-32">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Order summary
      </h2>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.variantId} className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
              {i.imageUrl && (
                <Image
                  src={i.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="line-clamp-1 text-sm font-medium">
                  {i.productName}
                </p>
                {i.isPreorder && <PreorderBadge variant="pill" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {i.variantName} · ×{i.quantity}
              </p>
              {i.isPreorder && i.preorderShipEstimate && (
                <p className="text-xs text-primary">
                  {i.preorderShipEstimate}
                </p>
              )}
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {formatCedis(i.unitPrice * i.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCedis(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery</span>
          <span className="tabular-nums">{formatCedis(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCedis(total)}</span>
        </div>
      </div>
    </aside>
  );
}
