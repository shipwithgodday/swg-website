import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { ArrowRight, Check, Package } from 'lucide-react';

import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { SignUpForOrders } from '@/components/shop/SignUpForOrders';
import { ClearCart } from '@/components/shop/ClearCart';
import { Button } from '@/components/ui/button';
import { verifyTransaction } from '@/lib/shop/paystack';
import { completeOrder } from '@/lib/shop/complete-order';
import { getOrderByNumber } from '@/lib/shop/orders';

export const metadata = { title: 'Processing payment' };

function Pending() {
  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-semibold">Confirming your payment…</h1>
      <p className="mt-3 text-muted-foreground">
        This can take a moment. Your order will appear under{' '}
        <Link href="/shop/orders" className="text-primary underline">
          My orders
        </Link>{' '}
        once payment is confirmed.
      </p>
    </Container>
  );
}

export default async function ProcessingPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;
  if (!reference) return <Pending />;

  let result: Awaited<ReturnType<typeof getOrderByNumber>> | null = null;
  try {
    const v = await verifyTransaction(reference);
    if (v.status === 'success') {
      // Claim the order now — the Paystack webhook also does this, and
      // whichever arrives first wins via the idempotent guard in
      // `completeOrder`. Doing it here too means the admin sees 'paid'
      // even if the webhook is slow or hasn't been configured yet.
      await completeOrder(reference, v.amount);
      result = await getOrderByNumber(reference);
    }
  } catch {
    result = null;
  }
  if (!result) return <Pending />;

  const { userId } = await auth();
  const { order, items } = result;

  return (
    <>
      {/* Clears the client cart on mount — runs for every successful
          confirmation render, guest and signed-in alike. Server-side
          `redirect()` would short-circuit before this could fire, so we
          render the confirmation inline for both flows. */}
      <ClearCart />

      <PageHero
        title="Order confirmed"
        highlightedWord="confirmed"
        subtitle={
          <>
            Order{' '}
            <span className="font-semibold text-primary not-italic">
              {order.orderNumber}
            </span>{' '}
            · payment received
          </>
        }
      />

      <Container className="py-12 md:py-16">
        <div className="grid items-start gap-6 md:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
                <Check className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-emerald-800">
                  Payment received
                </p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  Thanks for your order. We&apos;ll get it on its way
                  and email you tracking updates.
                </p>
              </div>
            </div>
            <OrderSummary order={order} items={items} />
          </div>

          {userId ? (
            <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-black">
                <Package className="size-5" />
              </span>
              <h2 className="mt-3 text-base font-semibold">
                Track this order
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                See the full status timeline, items and delivery
                details on your dashboard.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href={`/shop/orders/${order.orderNumber}`}>
                  Open this order <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Link
                href="/shop/orders"
                className="mt-3 block text-center text-sm font-medium text-primary underline-offset-4 hover:underline">
                All my orders
              </Link>
            </aside>
          ) : (
            <SignUpForOrders />
          )}
        </div>
      </Container>
    </>
  );
}
