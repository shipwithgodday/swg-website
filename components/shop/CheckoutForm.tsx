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

interface Zone {
  id: string;
  name: string;
  fee: number;
}

export function CheckoutForm({ zones }: { zones: Zone[] }) {
  const { items, subtotal } = useCart();
  const [zoneId, setZoneId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pending, start] = useTransition();

  const zone = zones.find((z) => z.id === zoneId);
  const total = subtotal + (zone?.fee ?? 0);

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
    return <p className="text-muted-foreground">Your cart is empty.</p>;
  }

  return (
    <form onSubmit={submit} className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-medium">Delivery details</h2>
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
          <Label htmlFor="city">City / Town</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Delivery region</Label>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              {zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.name} — {formatCedis(z.fee)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Order summary</h2>
        {items.map((i) => (
          <div
            key={i.variantId}
            className="flex justify-between text-sm">
            <span>
              {i.productName} ({i.variantName}) × {i.quantity}
            </span>
            <span>{formatCedis(i.unitPrice * i.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-3 text-sm">
          <span>Subtotal</span>
          <span>{formatCedis(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span>{zone ? formatCedis(zone.fee) : '—'}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span>{formatCedis(total)}</span>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={pending || !zoneId}>
          {pending ? 'Starting payment…' : 'Pay with Paystack'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Final amount is confirmed on the secure Paystack page.
        </p>
      </div>
    </form>
  );
}
