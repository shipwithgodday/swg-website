import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { getAdminOrder } from '@/lib/shop/admin-orders';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Order {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        Placed {format(new Date(order.createdAt), 'd MMM yyyy, HH:mm')}
        {order.paystackReference &&
          ` · Paystack ref ${order.paystackReference}`}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <OrderSummary order={order} items={items} />
          <div>
            <h2 className="mb-2 text-sm font-medium">Update status</h2>
            <OrderStatusUpdater
              orderId={order.id}
              status={order.status}
            />
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium">Customer</p>
            {customer ? (
              <p className="text-muted-foreground">
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="text-primary hover:underline">
                  {customer.name ?? customer.shippingMark}
                </Link>
                <br />
                Mark: {customer.shippingMark}
                <br />
                {customer.email ?? '—'}
                <br />
                {customer.phone ?? '—'}
              </p>
            ) : (
              <p className="text-muted-foreground">Unknown</p>
            )}
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="font-medium">Delivery</p>
            <p className="text-muted-foreground">
              {order.shipName}
              <br />
              {order.shipAddress}, {order.shipCity}
              <br />
              {order.shipRegion}
              <br />
              {order.shipPhone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
