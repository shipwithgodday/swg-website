import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import Container from '@/components/shared/container';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { OrderSummary } from '@/components/shop/OrderSummary';
import {
  getOrderByNumber,
  getCustomerByClerkId,
} from '@/lib/shop/orders';

export const metadata: Metadata = { title: 'Order' };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const result = await getOrderByNumber(orderNumber);
  if (!result) notFound();
  const { order, items } = result;

  const { userId } = await auth();
  const customer = userId ? await getCustomerByClerkId(userId) : null;
  if (!customer || customer.id !== order.customerId) notFound();

  return (
    <Container className="py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Order {order.orderNumber}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      {order.status === 'pending' && (
        <p className="mt-2 text-sm text-muted-foreground">
          We are still confirming your payment for this order.
        </p>
      )}
      <div className="mt-6 max-w-xl space-y-6">
        <OrderSummary order={order} items={items} />
        <div className="rounded-lg border border-border p-4 text-sm">
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
    </Container>
  );
}
