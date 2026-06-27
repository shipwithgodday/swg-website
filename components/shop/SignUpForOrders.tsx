'use client';
import Link from 'next/link';
import { Package } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Right-rail card shown to guests after a successful checkout, inviting
 * them to create an account so they can track this and future orders.
 */
export function SignUpForOrders() {
  return (
    <aside className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
      <span className="grid size-10 place-items-center rounded-full bg-primary text-black">
        <Package className="size-5" />
      </span>
      <h2 className="mt-3 text-base font-semibold">
        Track this order on your dashboard
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Create an account and we&apos;ll attach this order — and every
        future one — to your shipping mark, so you always know where
        your shipment is.
      </p>
      <Button asChild className="mt-4 w-full">
        <Link href="/sign-up?redirect_url=/shop/orders">Create account</Link>
      </Button>
    </aside>
  );
}
