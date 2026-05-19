import { formatCedis } from '@/lib/shop/money';

type TopProduct = { name: string; units: number; revenue: number };

/** Best-selling products panel for the dashboard. */
export function TopProducts({ products }: { products: TopProduct[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Top products</h2>
      {products.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">
          No sales in this period yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-1">
          {products.map((p, i) => (
            <li
              key={p.name}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600 tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                {p.name}
              </span>
              <span className="text-xs text-zinc-400 tabular-nums">
                {p.units} sold
              </span>
              <span className="text-sm font-medium text-zinc-900 tabular-nums">
                {formatCedis(p.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
