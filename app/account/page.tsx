import type { Metadata } from 'next';
import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import {
  ArrowRight,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  Tag,
  User,
} from 'lucide-react';

import Container from '@/components/shared/container';
import { PageHero } from '@/components/shared/PageHero';
import { MotionReveal } from '@/components/shop/MotionReveal';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { SignInCard } from '@/components/shop/SignInCard';
import { formatCedis } from '@/lib/shop/money';
import {
  getCustomerByClerkId,
  getOrdersForCustomer,
} from '@/lib/shop/orders';

export const metadata: Metadata = {
  title: 'Your Account',
  description: 'Your Ship With Godday account, orders and shipping mark.',
};

const RECENT_LIMIT = 5;

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <>
        <PageHero
          title="Your account"
          highlightedWord="account"
          subtitle="Sign in to see your orders, shipping mark, and details."
        />
        <Container className="py-12 md:py-16">
          <div className="mx-auto max-w-xl">
            <SignInCard
              title="Sign in to see your account"
              description="Your shipping mark and order history live on your account."
              redirectUrl="/account"
            />
          </div>
        </Container>
      </>
    );
  }

  const [customer, user] = await Promise.all([
    getCustomerByClerkId(userId),
    currentUser(),
  ]);

  const orders = customer
    ? (await getOrdersForCustomer(customer.id)).slice(0, RECENT_LIMIT)
    : [];

  const displayName = (
    customer?.name ??
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ??
    ''
  ).trim();
  const firstName = displayName.split(' ')[0] || '';
  const email =
    customer?.email ??
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null;
  const phone =
    customer?.phone ??
    user?.primaryPhoneNumber?.phoneNumber ??
    user?.phoneNumbers[0]?.phoneNumber ??
    null;

  return (
    <>
      <PageHero
        title={firstName ? `Hi, ${firstName}` : 'Your account'}
        highlightedWord={firstName || 'account'}
        subtitle={
          customer ? (
            <>
              Shipping mark{' '}
              <span className="font-semibold not-italic text-primary">
                {customer.shippingMark}
              </span>
            </>
          ) : (
            "You'll get your shipping mark when you place your first order."
          )
        }
      />

      <Container className="py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <MotionReveal>
            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Recent orders
                </h2>
                {orders.length > 0 && (
                  <Link
                    href="/shop/orders"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                    All orders <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-white text-muted-foreground shadow-sm">
                    <Package className="size-5" />
                  </span>
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm text-muted-foreground">
                    Your purchases will show up here once you place an
                    order.
                  </p>
                  <Link
                    href="/shop"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                    Browse the shop <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/shop/orders/${o.orderNumber}`}
                        className="flex flex-wrap items-center gap-4 rounded-lg py-3 transition-colors hover:bg-accent/40">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {o.orderNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(o.createdAt), 'd MMM yyyy')}
                          </p>
                        </div>
                        <OrderStatusBadge status={o.status} />
                        <p className="w-24 text-right font-semibold tabular-nums">
                          {formatCedis(o.total)}
                        </p>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </MotionReveal>

          <MotionReveal delay={0.05}>
            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Account details
              </h2>

              <div className="mt-2 divide-y divide-border">
                {customer && (
                  <InfoRow
                    icon={Tag}
                    label="Shipping mark"
                    value={customer.shippingMark}
                  />
                )}
                {email && (
                  <InfoRow icon={Mail} label="Email" value={email} />
                )}
                {displayName && (
                  <InfoRow
                    icon={User}
                    label="Name"
                    value={displayName}
                  />
                )}
                {phone && (
                  <InfoRow icon={Phone} label="Phone" value={phone} />
                )}
              </div>

              {(!displayName || !phone) && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {!displayName && !phone
                    ? 'Your delivery name and phone are captured at checkout.'
                    : !displayName
                      ? 'Your delivery name is captured at checkout.'
                      : 'Your delivery phone is captured at checkout.'}
                </p>
              )}

              <div className="mt-5 rounded-xl bg-muted/50 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="size-4 text-primary" />
                  Manage your sign-in
                </p>
                <p className="mt-1 text-muted-foreground">
                  Update your email and password from the avatar menu
                  in the navbar.
                </p>
              </div>
            </section>
          </MotionReveal>
        </div>
      </Container>
    </>
  );
}
