import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Check } from 'lucide-react';

import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { OrderSummary } from '@/components/shop/OrderSummary';
import { SignUpForOrders } from '@/components/shop/SignUpForOrders';
import { verifyTransaction } from '@/lib/shop/paystack';
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
    const r = await getOrderByNumber(reference);
    if (r && v.status === 'success') result = r;
  } catch {
    result = null;
  }
  if (!result) return <Pending />;

  // Signed-in shoppers go straight to the rich order page in their
  // dashboard. Guests don't have access there (it's gated by Clerk +
  // customer ownership), so we render the confirmation inline below
  // with an invitation to create an account.
  const { userId } = await auth();
  if (userId) redirect(`/shop/orders/${reference}`);

  const { order, items } = result;
  return (
    <>
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
        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
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
          <SignUpForOrders />
        </div>
      </Container>
    </>
  );
}
