'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { nextStatuses } from '@/lib/shop/order-status';
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
  const options = nextStatuses(status);

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This order is {status}; no further changes.
      </p>
    );
  }

  function move(to: string) {
    start(async () => {
      const res = await updateOrderStatus(orderId, to);
      if (res.ok) {
        toast.success(`Order marked ${to}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((to) => (
        <Button
          key={to}
          variant={to === 'cancelled' ? 'destructive' : 'default'}
          disabled={pending}
          onClick={() => move(to)}>
          Mark {to}
        </Button>
      ))}
    </div>
  );
}
