'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/ui/label';
import { updateCustomer } from '@/app/actions/shop/admin-customers';

interface Props {
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  /** Called after a successful save (e.g. to close a dialog). */
  onSaved?: () => void;
}

export function CustomerEditForm({ customer, onSaved }: Props) {
  const router = useRouter();
  const [name, setName] = useState(customer.name ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateCustomer(customer.id, {
        name: name || null,
        email: email || null,
        phone: phone || null,
      });
      if (res.ok) {
        toast.success('Customer updated');
        router.refresh();
        onSaved?.();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="c-name">Name</Label>
        <Input
          id="c-name"
          className="text-foreground"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-email">Email</Label>
        <Input
          id="c-email"
          type="email"
          className="text-foreground"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="c-phone">Phone</Label>
        <Input
          id="c-phone"
          className="text-foreground"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <Button type="submit" variant="gold" disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
