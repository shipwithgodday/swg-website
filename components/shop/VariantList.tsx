import { formatCedis } from '@/lib/shop/money';

interface Variant {
  id: string;
  name: string;
  price: number;
  stockQuantity: number;
}

export function VariantList({ variants }: { variants: Variant[] }) {
  return (
    <div className="space-y-2">
      {variants.map((v) => (
        <div
          key={v.id}
          className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <div>
            <p className="font-medium">{v.name}</p>
            <p className="text-sm text-muted-foreground">
              {v.stockQuantity > 0
                ? `${v.stockQuantity} in stock`
                : 'Out of stock'}
            </p>
          </div>
          <p className="font-medium">{formatCedis(v.price)}</p>
        </div>
      ))}
    </div>
  );
}
