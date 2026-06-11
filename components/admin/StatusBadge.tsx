import { cn } from '@/lib/utils';
import {
  formatOrderStatus,
  formatProductStatus,
} from '@/lib/shop/status-format';

const ORDER_TONES: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  paid: 'bg-sky-50 text-sky-700 ring-sky-200',
  processing: 'bg-amber-50 text-amber-800 ring-amber-200',
  procured_china: 'bg-orange-50 text-orange-800 ring-orange-200',
  shipped: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  arrived_ghana: 'bg-teal-50 text-teal-700 ring-teal-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

const PRODUCT_TONES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  draft: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  archived: 'bg-amber-50 text-amber-800 ring-amber-200',
};

const FALLBACK_TONE = 'bg-zinc-100 text-zinc-700 ring-zinc-200';

/** A pill showing a capitalized order or product status with a tone. */
export function StatusBadge({
  status,
  kind,
}: {
  status: string;
  kind: 'order' | 'product';
}) {
  const label =
    kind === 'order'
      ? formatOrderStatus(status)
      : formatProductStatus(status);
  const tone =
    (kind === 'order' ? ORDER_TONES : PRODUCT_TONES)[status] ??
    FALLBACK_TONE;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tone
      )}>
      {label}
    </span>
  );
}
