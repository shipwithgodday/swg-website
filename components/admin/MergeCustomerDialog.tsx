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
import { Button } from '@/components/ui/button';
import { mergeCustomers } from '@/app/actions/shop/admin-customers';

interface Candidate {
  id: string;
  shippingMark: string;
  name: string | null;
}

/**
 * Merges another customer INTO this one (this customer survives, keeps
 * its shipping mark; the other's orders move here and the other is
 * deleted).
 */
export function MergeCustomerDialog({
  survivorId,
  survivorMark,
  candidates,
}: {
  survivorId: string;
  survivorMark: string;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mergedId, setMergedId] = useState('');
  const [pending, start] = useTransition();

  function doMerge() {
    if (!mergedId) return;
    start(async () => {
      const res = await mergeCustomers(survivorId, mergedId);
      if (res.ok) {
        toast.success('Customers merged');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Merge another customer in</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge into {survivorMark}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          The selected customer&apos;s orders move to {survivorMark} and
          that customer record is deleted. This cannot be undone.
        </p>
        <select
          value={mergedId}
          onChange={(e) => setMergedId(e.target.value)}
          className="h-9 w-full rounded-md border border-input px-2 text-sm">
          <option value="">Select a customer to merge in…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shippingMark} — {c.name ?? 'unnamed'}
            </option>
          ))}
        </select>
        <Button
          variant="destructive"
          disabled={pending || !mergedId}
          onClick={doMerge}>
          {pending ? 'Merging…' : 'Merge'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
