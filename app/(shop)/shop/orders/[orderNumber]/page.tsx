import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Container from '@/components/shared/container';
import SectionHeader from '@/components/shared/section-header';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { OrderStatusTimeline } from '@/components/shop/OrderStatusTimeline';
import { MotionReveal } from '@/components/shop/MotionReveal';
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
    <Container className="py-10 md:py-14">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/shop/orders" className="hover:text-foreground">
          Orders
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{order.orderNumber}</span>
      </nav>

      <MotionReveal>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionHeader highlightedWord={order.orderNumber} size="base">
              Order {order.orderNumber}
            </SectionHeader>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed {format(new Date(order.createdAt), 'd MMM yyyy')}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </MotionReveal>

      <MotionReveal className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6" delay={0.05}>
        <OrderStatusTimeline status={order.status} />
      </MotionReveal>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_360px]">
        <MotionReveal delay={0.1}>
          <OrderSummary order={order} items={items} />
        </MotionReveal>
        <MotionReveal delay={0.15}>
          <div className="rounded-2xl border border-border bg-white p-5 text-sm shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Delivery
            </p>
            <p className="mt-2 font-medium">{order.shipName}</p>
            <p className="text-muted-foreground">
              {order.shipAddress}
              <br />
              {order.shipCity}, {order.shipRegion}
              <br />
              {order.shipPhone}
            </p>
          </div>
        </MotionReveal>
      </div>
    </Container>
  );
}
