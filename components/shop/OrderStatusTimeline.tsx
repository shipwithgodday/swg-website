import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'paid', label: 'Paid' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const;

const STEP_INDEX: Record<string, number> = {
  pending: -1,
  paid: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

/**
 * Horizontal status timeline. Cancelled orders short-circuit to a single
 * destructive note; everything else lights up steps up to the current status.
 */
export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200">
        This order was cancelled.
      </p>
    );
  }
  const current = STEP_INDEX[status] ?? -1;
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {STEPS.map((step, i) => {
        const reached = i <= current;
        const isLast = i === STEPS.length - 1;
        return (
          <li
            key={step.key}
            className="flex flex-1 items-center gap-3 min-w-[8rem]">
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full ring-1',
                reached
                  ? 'bg-primary text-black ring-primary'
                  : 'bg-white text-muted-foreground ring-border'
              )}>
              {reached ? (
                <Check className="size-4" />
              ) : (
                <span className="text-xs font-semibold tabular-nums">
                  {i + 1}
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                reached ? 'text-foreground' : 'text-muted-foreground'
              )}>
              {step.label}
            </span>
            {!isLast && (
              <span
                className={cn(
                  'mx-2 h-px flex-1',
                  reached ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
