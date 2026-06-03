import { formatCedis } from '@/lib/shop/money';
import { variantLabel } from '@/lib/shop/variant-label';
import { PreorderBadge } from './PreorderBadge';

interface Item {
  id: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  isPreorder: boolean;
  preorderShipEstimate: string | null;
}

interface Order {
  subtotal: number;
  total: number;
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{i.productName}</p>
                {i.isPreorder && <PreorderBadge variant="pill" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {variantLabel(i.variantName)
                  ? `${variantLabel(i.variantName)} · ×${i.quantity}`
                  : `×${i.quantity}`}
              </p>
              {i.isPreorder && i.preorderShipEstimate && (
                <p className="text-xs text-primary">
                  {i.preorderShipEstimate}
                </p>
              )}
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
        <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatCedis(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
