import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import Container from '@/components/shared/container';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import {
  getCustomerByClerkId,
  getOrdersForCustomer,
} from '@/lib/shop/orders';

export const metadata: Metadata = { title: 'My Orders' };

export default async function OrdersPage() {
  const { userId } = await auth();
  const customer = userId ? await getCustomerByClerkId(userId) : null;
  const orders = customer
    ? await getOrdersForCustomer(customer.id)
    : [];

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-semibold">My orders</h1>
      {customer && (
        <p className="mt-1 text-sm text-muted-foreground">
          Shipping mark: <strong>{customer.shippingMark}</strong>
        </p>
      )}
      <div className="mt-8 space-y-3">
        {orders.length === 0 && (
          <p className="text-muted-foreground">No orders yet.</p>
        )}
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/shop/orders/${o.orderNumber}`}
            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent">
            <div>
              <p className="font-medium">{o.orderNumber}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(o.createdAt), 'd MMM yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusBadge status={o.status} />
              <span className="font-medium">
                {formatCedis(o.total)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
