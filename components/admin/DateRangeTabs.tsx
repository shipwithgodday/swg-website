'use client';
import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  DASHBOARD_RANGES,
  RANGE_LABELS,
  parseRange,
} from '@/lib/shop/date-range';

/** Segmented control that drives the dashboard `?range=` query param. */
export function DateRangeTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const active = parseRange(params.get('range') ?? undefined);
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-zinc-200 bg-white p-0.5',
        pending && 'opacity-70'
      )}>
      {DASHBOARD_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() =>
            startTransition(() => router.push(`/admin?range=${range}`))
          }
          className={cn(
            'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active === range
              ? 'bg-zinc-900 text-white'
              : 'text-zinc-600 hover:text-zinc-900'
          )}>
          {RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  );
}
