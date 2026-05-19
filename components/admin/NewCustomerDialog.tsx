'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/ui/label';
import { createCustomer } from '@/app/actions/shop/admin-customers';

/** Creates a customer manually and navigates to their detail page. */
export function NewCustomerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pending, start] = useTransition();

  function reset() {
    setName('');
    setEmail('');
    setPhone('');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createCustomer({
        name,
        email: email || null,
        phone: phone || null,
      });
      if (res.ok && res.id) {
        toast.success('Customer created');
        setOpen(false);
        reset();
        router.push(`/admin/customers/${res.id}`);
      } else {
        toast.error(res.ok ? 'Could not create customer' : res.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}>
      <DialogTrigger asChild>
        <Button variant="gold">New customer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="nc-name">Name</Label>
            <Input
              id="nc-name"
              className="text-foreground"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-email">Email</Label>
            <Input
              id="nc-email"
              type="email"
              className="text-foreground"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-phone">Phone</Label>
            <Input
              id="nc-phone"
              className="text-foreground"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A shipping mark is assigned automatically.
          </p>
          <Button type="submit" variant="gold" disabled={pending || !name.trim()}>
            {pending ? 'Creating…' : 'Create customer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
