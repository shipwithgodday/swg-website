import Link from 'next/link';
import { format } from 'date-fns';
import { getDashboardMetrics } from '@/lib/shop/admin-dashboard';
import { formatCedis } from '@/lib/shop/money';
import { StatCard } from '@/components/admin/StatCard';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';

export default async function AdminDashboardPage() {
  const m = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue (24h)"
          value={formatCedis(m.today.revenue)}
          hint={`${m.today.count} orders`}
        />
        <StatCard
          label="Revenue (7d)"
          value={formatCedis(m.week.revenue)}
          hint={`${m.week.count} orders`}
        />
        <StatCard
          label="Revenue (30d)"
          value={formatCedis(m.month.revenue)}
          hint={`${m.month.count} orders`}
        />
        <StatCard
          label="Needs attention"
          value={String(m.ordersNeedingAttention)}
          hint="paid / processing orders"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium">Recent orders</h2>
          <div className="space-y-2">
            {m.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No orders yet.
              </p>
            )}
            {m.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent">
                <span className="font-medium">{o.orderNumber}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(o.createdAt), 'd MMM')}
                </span>
                <OrderStatusBadge status={o.status} />
                <span className="font-medium">
                  {formatCedis(o.total)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium">Low stock</h2>
          <div className="space-y-2">
            {m.lowStock.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing low on stock.
              </p>
            )}
            {m.lowStock.map((v) => (
              <Link
                key={v.id}
                href={`/admin/products/${v.productId}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent">
                <span>
                  {v.productName}{' '}
                  <span className="text-muted-foreground">
                    ({v.variantName})
                  </span>
                </span>
                <span className="font-medium">{v.stock} left</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {m.customerCount} customers total.
      </p>
    </div>
  );
}
