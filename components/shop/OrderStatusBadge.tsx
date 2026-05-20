import { cn } from '@/lib/utils';
import { formatOrderStatus } from '@/lib/shop/status-format';

const TONES: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  paid: 'bg-sky-50 text-sky-700 ring-sky-200',
  processing: 'bg-amber-50 text-amber-800 ring-amber-200',
  shipped: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

const FALLBACK = 'bg-zinc-100 text-zinc-700 ring-zinc-200';

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[status] ?? FALLBACK
      )}>
      {formatOrderStatus(status)}
    </span>
  );
}
