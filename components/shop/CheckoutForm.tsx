'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
// The storefront Input/Select are styled for dark hero panels (white text,
// bottom-only border, navy popover). The checkout form sits on a light
// background, so we use the neutral primitives instead.
import { Input } from '@/components/admin/ui/input';
import { useCart } from '@/lib/cart-context';
import { createCheckout } from '@/app/actions/shop/checkout';
import { CheckoutSummary } from '@/components/shop/CheckoutSummary';

interface CheckoutFormProps {
  /** True when a Clerk session is active. Guests still get to check out. */
  signedIn: boolean;
  /** Delivery details from a returning customer's last order, if any. */
  prefill?: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
}

export function CheckoutForm({ signedIn, prefill }: CheckoutFormProps) {
  const { items } = useCart();
  const [email, setEmail] = useState('');
  const [name, setName] = useState(prefill?.name ?? '');
  const [phone, setPhone] = useState(prefill?.phone ?? '');
  const [address, setAddress] = useState(prefill?.address ?? '');
  const [city, setCity] = useState(prefill?.city ?? '');
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    start(async () => {
      const res = await createCheckout({
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shipName: name,
        shipPhone: phone,
        shipAddress: address,
        shipCity: city,
        ...(signedIn ? {} : { shipEmail: email }),
      });
      if (res.ok) {
        window.location.href = res.authorizationUrl;
      } else {
        toast.error(res.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-muted-foreground">
        Your cart is empty.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
      <div className="space-y-8">
        {!signedIn && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-5 py-4">
            <div className="min-w-0 max-w-sm">
              <p className="text-sm font-semibold text-foreground">
                Create an account to track your orders
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                See your purchase history, get your shipping mark, and
                skip filling in your details next time.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <SignInButton
                mode="modal"
                forceRedirectUrl="/shop/checkout"
                signUpForceRedirectUrl="/shop/checkout">
                <button
                  type="button"
                  className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                  Sign in
                </button>
              </SignInButton>
              <Link
                href="/sign-up?redirect_url=/shop/checkout"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-black transition-transform hover:scale-105">
                Create account
              </Link>
            </div>
          </div>
        )}

        <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Delivery details
          </h2>
          {!signedIn && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="We'll send the order confirmation here"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              autoComplete="street-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City / town</Label>
            <Input
              id="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
        </section>

        <Button
          type="submit"
          disabled={pending}
          className="w-full text-base">
          {pending ? 'Redirecting to payment…' : 'Pay with Paystack'}
        </Button>
      </div>

      <CheckoutSummary />
    </form>
  );
}
