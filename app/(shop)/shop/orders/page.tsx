import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import { ArrowRight, Package } from 'lucide-react';
import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { SignInCard } from '@/components/shop/SignInCard';
import { MotionReveal } from '@/components/shop/MotionReveal';
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
    <>
      <PageHero
        title="Your orders"
        highlightedWord="orders"
        subtitle={
          customer ? (
            <>
              Shipping mark{' '}
              <span className="font-semibold not-italic text-primary">
                {customer.shippingMark}
              </span>
            </>
          ) : (
            'Sign in to see your past orders.'
          )
        }
      />

      <Container className="py-12 md:py-16">
        <MotionReveal>
          {!userId ? (
            <div className="mx-auto max-w-xl">
              <SignInCard
                title="Sign in to see your orders"
                description="Your shipping mark and order history live on your account."
                redirectUrl="/shop/orders"
              />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-white text-muted-foreground shadow-sm">
                <Package className="size-5" />
              </span>
              <p className="font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                When you place an order it&apos;ll show up here.
              </p>
              <Link
                href="/shop"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                Browse the shop <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/shop/orders/${o.orderNumber}`}
                    className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-accent/40 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(o.createdAt), 'd MMM yyyy')}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <p className="w-28 text-right font-semibold tabular-nums">
                      {formatCedis(o.total)}
                    </p>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </MotionReveal>
      </Container>
    </>
  );
}
