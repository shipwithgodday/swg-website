import { Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreorderBadgeProps {
  /**
   * `pill` is the compact form used on product cards and inline cart/checkout
   * rows. `block` is the larger form used on the product detail page; it
   * stacks the badge over the ship estimate when one is provided.
   */
  variant?: 'pill' | 'block';
  /** Optional ship estimate (e.g. "Ships in ~2 weeks"). */
  shipEstimate?: string | null;
  className?: string;
}

export function PreorderBadge({
  variant = 'pill',
  shipEstimate,
  className,
}: PreorderBadgeProps) {
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary',
          className
        )}>
        <Clock3 className="size-3" />
        Preorder
      </span>
    );
  }
  return (
    <div className={cn('mt-3 inline-flex flex-col gap-1', className)}>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
        <Clock3 className="size-3.5" />
        Preorder
      </span>
      {shipEstimate && (
        <p className="text-sm text-muted-foreground">{shipEstimate}</p>
      )}
    </div>
  );
}
