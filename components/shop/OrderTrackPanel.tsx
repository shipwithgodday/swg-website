'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Package, Loader2, ChevronDown } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { OrderStatusTimeline } from '@/components/shop/OrderStatusTimeline';

type OrderItem = {
  productName: string;
  variantName: string;
  quantity: number;
  isPreorder: boolean;
  preorderShipEstimate: string | null;
};

type OrderResult =
  | {
      found: true;
      orderNumber: string;
      status: string;
      createdAt: string;
      shippingMark: string;
      items: OrderItem[];
    }
  | { found: false };

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; data: Extract<OrderResult, { found: true }> }
  | { status: 'not-found'; orderNumber: string }
  | { status: 'error' };

export function OrderTrackPanel() {
  const searchParams = useSearchParams();
  const deepLinkOrder = searchParams.get('order');

  const [open, setOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });
  const ranDeepLink = useRef(false);

  const runLookup = useCallback(async (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    setLookup({ status: 'loading' });
    try {
      const res = await fetch(
        `/api/track/order?orderNumber=${encodeURIComponent(value)}`
      );
      const data = (await res.json()) as OrderResult;
      if (data.found) {
        setLookup({ status: 'found', data });
      } else {
        setLookup({ status: 'not-found', orderNumber: value });
      }
    } catch {
      setLookup({ status: 'error' });
    }
  }, []);

  // Deep link: /track?order=SWG-… auto-opens the panel, prefills, and looks up.
  useEffect(() => {
    if (deepLinkOrder && !ranDeepLink.current) {
      ranDeepLink.current = true;
      setOpen(true);
      setOrderNumber(deepLinkOrder);
      void runLookup(deepLinkOrder);
    }
  }, [deepLinkOrder, runLookup]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runLookup(orderNumber);
  }

  const isLoading = lookup.status === 'loading';

  return (
    <div className="mx-auto mt-10 max-w-md border-t border-zinc-100 pt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200/70 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-zinc-50">
        <span className="flex items-center gap-2.5">
          <Package className="size-4 shrink-0 text-[#00254F]" />
          <span className="text-sm font-medium text-zinc-800">
            Ordered through our shop? Check your order status
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-zinc-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-zinc-500">
            For orders placed through our online shop. Enter the order number
            from your confirmation email (it looks like{' '}
            <span className="font-mono">SWG-XXXXXXXX</span>).
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              aria-label="Order number"
              placeholder="e.g. SWG-7K2P9QXM"
              disabled={isLoading}
              className="block w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!orderNumber.trim() || isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Checking…
                </>
              ) : (
                'Check Order'
              )}
            </button>
          </form>

          {lookup.status === 'not-found' && (
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
              <p className="font-mono text-xs font-semibold tracking-widest text-zinc-500 uppercase">
                {lookup.orderNumber}
              </p>
              <p className="mt-2 text-sm text-zinc-700">
                No order found for that number. Double-check the order number in
                your confirmation email.
              </p>
            </div>
          )}

          {lookup.status === 'error' && (
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
              <p className="text-sm text-zinc-700">
                Something went wrong looking up that order. Please try again.
              </p>
            </div>
          )}

          {lookup.status === 'found' && <OrderResultCard data={lookup.data} />}
        </div>
      )}
    </div>
  );
}

function OrderResultCard({
  data,
}: {
  data: Extract<OrderResult, { found: true }>;
}) {
  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            Order
          </span>
          <p className="mt-1 font-mono text-lg font-bold text-zinc-900">
            {data.orderNumber}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Placed {format(new Date(data.createdAt), 'd MMM yyyy')}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-400">Shipping mark</span>
          <p className="font-mono text-sm font-semibold text-zinc-900">
            {data.shippingMark}
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-100 pt-5">
        <OrderStatusTimeline status={data.status} />
      </div>

      <div className="border-t border-zinc-100 pt-5">
        <p className="mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Items
        </p>
        <ul className="space-y-1.5">
          {data.items.map((item, i) => (
            <li
              key={i}
              className="flex justify-between gap-3 text-sm text-zinc-700">
              <span>
                {item.productName}{' '}
                <span className="text-zinc-400">({item.variantName})</span>
                {item.isPreorder && (
                  <span className="ml-1 text-xs text-amber-700">
                    Preorder
                    {item.preorderShipEstimate
                      ? ` — ${item.preorderShipEstimate}`
                      : ''}
                  </span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-zinc-500">
                × {item.quantity}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-zinc-100 pt-5">
        <SignedOut>
          <SignInButton
            mode="modal"
            forceRedirectUrl={`/shop/orders/${data.orderNumber}`}>
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline">
              Want delivery details and your full order history? Log in →
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href={`/shop/orders/${data.orderNumber}`}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline">
            View full order details →
          </Link>
        </SignedIn>
      </div>
    </div>
  );
}
