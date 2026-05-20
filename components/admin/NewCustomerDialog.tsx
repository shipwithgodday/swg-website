'use client';
import { useEffect, useState, useTransition } from 'react';
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
import {
  createCustomer,
  getNextShippingMark,
} from '@/app/actions/shop/admin-customers';

/** Creates a customer manually and navigates to their detail page. */
export function NewCustomerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mark, setMark] = useState('');
  const [nextMark, setNextMark] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Peek at what mark the server would assign so the admin sees it before
  // submitting. Refreshed every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    getNextShippingMark()
      .then((v) => {
        if (alive) setNextMark(v);
      })
      .catch(() => {
        if (alive) setNextMark(null);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  function reset() {
    setName('');
    setEmail('');
    setPhone('');
    setMark('');
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createCustomer({
        name,
        email: email || null,
        phone: phone || null,
        shippingMark: mark.trim() || undefined,
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-mark">Shipping mark</Label>
            <Input
              id="nc-mark"
              value={mark}
              onChange={(e) => setMark(e.target.value)}
              placeholder={nextMark ?? 'Auto-assigned'}
              autoComplete="off"
            />
            <p className="text-xs text-zinc-500">
              {nextMark ? (
                <>
                  Will be assigned{' '}
                  <span className="font-medium text-zinc-900 tabular-nums">
                    {nextMark}
                  </span>{' '}
                  — type a different mark to override.
                </>
              ) : (
                'Leave blank to auto-assign the next GD number.'
              )}
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-email">Email</Label>
            <Input
              id="nc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nc-phone">Phone</Label>
            <Input
              id="nc-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="gold"
            disabled={pending || !name.trim()}>
            {pending ? 'Creating…' : 'Create customer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
