'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/admin/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select';
import {
  canCancelFrom,
  forwardStatuses,
} from '@/lib/shop/order-status';
import { formatOrderStatus } from '@/lib/shop/status-format';
import { updateOrderStatus } from '@/app/actions/shop/admin-orders';

export function OrderStatusUpdater({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const forward = forwardStatuses(status);
  const cancellable = canCancelFrom(status);
  const [selected, setSelected] = useState<string>('');

  function move(to: string) {
    start(async () => {
      const res = await updateOrderStatus(orderId, to);
      if (res.ok) {
        toast.success(`Order marked ${formatOrderStatus(to)}`);
        setSelected('');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (forward.length === 0 && !cancellable) {
    return (
      <p className="text-sm text-muted-foreground">
        No further status changes available.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {forward.length > 0 && (
        <>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger size="sm" className="w-48">
              <SelectValue placeholder="Change status to…" />
            </SelectTrigger>
            <SelectContent>
              {forward.map((s) => (
                <SelectItem key={s} value={s}>
                  Mark as {formatOrderStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="gold"
            size="sm"
            disabled={!selected || pending}
            onClick={() => selected && move(selected)}>
            {pending ? 'Updating…' : 'Update'}
          </Button>
        </>
      )}
      {cancellable && (
        <Button
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (
              confirm(
                'Cancel this order? The customer will be emailed.'
              )
            ) {
              move('cancelled');
            }
          }}>
          Cancel order
        </Button>
      )}
    </div>
  );
}
