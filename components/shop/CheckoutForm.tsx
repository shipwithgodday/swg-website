'use client';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/lib/cart-context';
import { formatCedis } from '@/lib/shop/money';
import { createCheckout } from '@/app/actions/shop/checkout';
import { CheckoutSummary } from '@/components/shop/CheckoutSummary';

interface Zone {
  id: string;
  name: string;
  fee: number;
}

export function CheckoutForm({ zones }: { zones: Zone[] }) {
  const { items } = useCart();
  const [zoneId, setZoneId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pending, start] = useTransition();

  const zone = zones.find((z) => z.id === zoneId);
  const deliveryFee = zone?.fee ?? 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    if (!zoneId) {
      toast.error('Pick a delivery region.');
      return;
    }
    start(async () => {
      const res = await createCheckout({
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        deliveryZoneId: zoneId,
        shipName: name,
        shipPhone: phone,
        shipAddress: address,
        shipCity: city,
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
        <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Delivery details
          </h2>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City / town</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Region & delivery fee
          </h2>
          <div className="space-y-2">
            <Label htmlFor="zone">Region</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger id="zone">
                <SelectValue placeholder="Pick your region" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name} · {formatCedis(z.fee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <Button
          type="submit"
          disabled={pending}
          className="w-full text-base">
          {pending ? 'Redirecting to payment…' : 'Pay with Paystack'}
        </Button>
      </div>

      <CheckoutSummary deliveryFee={deliveryFee} />
    </form>
  );
}
