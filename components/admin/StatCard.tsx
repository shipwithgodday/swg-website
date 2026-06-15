import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/** A dashboard KPI card with optional icon, gold accent, and delta. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  /** Percentage change vs. the previous period. */
  delta?: number;
  /** Adds the gold accent treatment. */
  accent?: boolean;
}) {
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm',
        accent && 'ring-1 ring-primary/25'
      )}>
      {accent && (
        <span className="absolute inset-x-0 top-0 h-1 bg-primary" />
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        {Icon && (
          <span
            className={cn(
              'grid size-8 place-items-center rounded-lg',
              accent
                ? 'bg-primary/15 text-amber-700'
                : 'bg-zinc-100 text-zinc-600'
            )}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {hasDelta && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
              up ? 'text-emerald-600' : 'text-red-600'
            )}>
            {up ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(delta as number).toFixed(0)}%
          </span>
        )}
        {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      </div>
    </div>
  );
}
