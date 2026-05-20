import { formatCedis } from '@/lib/shop/money';

interface Item {
  id: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  subtotal: number;
  deliveryFee: number;
  total: number;
  shipRegion: string | null;
}

export function OrderSummary({
  order,
  items,
}: {
  order: Order;
  items: Item[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Items
      </h2>
      <ul className="mt-3 divide-y divide-border">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex items-start justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">{i.productName}</p>
              <p className="text-xs text-muted-foreground">
                {i.variantName} · ×{i.quantity}
              </p>
            </div>
            <p className="font-semibold tabular-nums">
              {formatCedis(i.unitPrice * i.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">
            {formatCedis(order.subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>
            Delivery{' '}
            {order.shipRegion && (
              <span className="text-foreground/70">
                ({order.shipRegion})
              </span>
            )}
          </span>
          <span className="tabular-nums">
            {formatCedis(order.deliveryFee)}
          </span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCedis(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
