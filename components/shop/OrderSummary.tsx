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
    <div className="space-y-2 rounded-lg border border-border p-4">
      {items.map((i) => (
        <div key={i.id} className="flex justify-between text-sm">
          <span>
            {i.productName} ({i.variantName}) × {i.quantity}
          </span>
          <span>{formatCedis(i.unitPrice * i.quantity)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-2 text-sm">
        <span>Subtotal</span>
        <span>{formatCedis(order.subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Delivery {order.shipRegion ? `(${order.shipRegion})` : ''}</span>
        <span>{formatCedis(order.deliveryFee)}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-2 font-medium">
        <span>Total</span>
        <span>{formatCedis(order.total)}</span>
      </div>
    </div>
  );
}
