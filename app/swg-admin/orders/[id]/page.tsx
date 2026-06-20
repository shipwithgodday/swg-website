import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

import { getAdminOrder } from '@/lib/shop/admin-orders';
import { formatOrderStatus } from '@/lib/shop/status-format';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { OrderStatusTimeline } from '@/components/shop/OrderStatusTimeline';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';
import { MotionReveal } from '@/components/shared/MotionReveal';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminOrder(id);
  if (!data) notFound();
  const { order, customer, items } = data;

  return (
    <div className="space-y-8">
      <MotionReveal>
        <AdminPageHeader
          title={`Order ${order.orderNumber}`}
          description={[
            `Placed ${format(new Date(order.createdAt), 'd MMM yyyy, HH:mm')}`,
            order.paystackReference
              ? `Paystack ${order.paystackReference}`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}>
          <StatusBadge status={order.status} kind="order" />
        </AdminPageHeader>
      </MotionReveal>

      <MotionReveal delay={0.05} as="section" className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Current status
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {formatOrderStatus(order.status)}
            </p>
          </div>
          <OrderStatusUpdater orderId={order.id} status={order.status} />
        </div>
        <div className="mt-6 border-t border-zinc-100 pt-6">
          <OrderStatusTimeline status={order.status} />
        </div>
      </MotionReveal>

      <MotionReveal delay={0.1} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <OrderSummary order={order} items={items} />

        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Customer
            </p>
            {customer ? (
              <div className="mt-3 space-y-1 text-sm">
                <Link
                  href={`/swg-admin/customers/${customer.id}`}
                  className="font-semibold text-zinc-900 underline-offset-4 hover:underline">
                  {customer.name ?? customer.shippingMark}
                </Link>
                <p className="text-zinc-500">
                  Mark{' '}
                  <span className="font-medium text-zinc-700 tabular-nums">
                    {customer.shippingMark}
                  </span>
                </p>
                <p className="text-zinc-500">{customer.email ?? '—'}</p>
                <p className="text-zinc-500">{customer.phone ?? '—'}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">Unknown</p>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              Delivery
            </p>
            <div className="mt-3 space-y-0.5 text-sm">
              <p className="font-medium text-zinc-900">{order.shipName}</p>
              <p className="text-zinc-500">{order.shipAddress}</p>
              <p className="text-zinc-500">{order.shipCity}</p>
              <p className="text-zinc-500">{order.shipPhone}</p>
            </div>
          </section>
        </div>
      </MotionReveal>
    </div>
  );
}
