import Link from 'next/link';
import { format } from 'date-fns';
import { Banknote, ShoppingBag, Receipt, AlertCircle } from 'lucide-react';

import {
  getDashboardMetrics,
  getRevenueSeries,
  getTopProducts,
} from '@/lib/shop/admin-dashboard';
import { parseRange } from '@/lib/shop/date-range';
import { formatCedis } from '@/lib/shop/money';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DateRangeTabs } from '@/components/admin/DateRangeTabs';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { TopProducts } from '@/components/admin/TopProducts';
import { MotionReveal } from '@/components/shared/MotionReveal';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);
  const [metrics, series, topProducts] = await Promise.all([
    getDashboardMetrics(range),
    getRevenueSeries(range),
    getTopProducts(range, 5),
  ]);

  return (
    <div className="space-y-8">
      <MotionReveal>
        <AdminPageHeader
          title="Dashboard"
          description="Sales performance and what needs attention.">
          <DateRangeTabs />
        </AdminPageHeader>
      </MotionReveal>

      <MotionReveal delay={0.05} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCedis(metrics.revenue.value)}
          delta={metrics.revenue.delta}
          icon={Banknote}
          accent
        />
        <StatCard
          label="Orders"
          value={String(metrics.orders.value)}
          delta={metrics.orders.delta}
          icon={ShoppingBag}
        />
        <StatCard
          label="Avg order value"
          value={formatCedis(metrics.aov.value)}
          delta={metrics.aov.delta}
          icon={Receipt}
        />
        <StatCard
          label="Needs attention"
          value={String(metrics.ordersNeedingAttention)}
          hint="paid / processing"
          icon={AlertCircle}
        />
      </MotionReveal>

      <MotionReveal delay={0.1}>
        <RevenueChart data={series} />
      </MotionReveal>

      <MotionReveal delay={0.15} className="grid gap-6 lg:grid-cols-2">
        <TopProducts products={topProducts} />

        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">
            Recent orders
          </h2>
          <div className="mt-4 space-y-1">
            {metrics.recentOrders.length === 0 && (
              <p className="text-sm text-zinc-400">No orders yet.</p>
            )}
            {metrics.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50">
                <span className="font-medium text-zinc-900">
                  {o.orderNumber}
                </span>
                <span className="text-xs text-zinc-400">
                  {format(new Date(o.createdAt), 'd MMM')}
                </span>
                <span className="ml-auto">
                  <StatusBadge status={o.status} kind="order" />
                </span>
                <span className="min-w-20 text-right font-medium text-zinc-900 tabular-nums">
                  {formatCedis(o.total)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </MotionReveal>

      <MotionReveal delay={0.2} className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Low stock</h2>
        <div className="mt-4 space-y-1">
          {metrics.lowStock.length === 0 && (
            <p className="text-sm text-zinc-400">Nothing low on stock.</p>
          )}
          {metrics.lowStock.map((v) => (
            <Link
              key={v.id}
              href={`/admin/products?edit=${v.productId}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50">
              <span className="min-w-0 flex-1 text-sm text-zinc-800">
                {v.productName}{' '}
                <span className="text-zinc-400">({v.variantName})</span>
              </span>
              <span className="ml-auto text-sm font-medium text-zinc-900 tabular-nums">
                {v.stock} left
              </span>
            </Link>
          ))}
        </div>
      </MotionReveal>

      <MotionReveal delay={0.25}>
        <p className="text-sm text-zinc-400">
          {metrics.customerCount} customers total.
        </p>
      </MotionReveal>
    </div>
  );
}
