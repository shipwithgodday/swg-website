export const DASHBOARD_RANGES = ['today', '7d', '30d', '90d'] as const;

export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export const DEFAULT_RANGE: DashboardRange = '7d';

const RANGE_DAYS: Record<DashboardRange, number> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const RANGE_LABELS: Record<DashboardRange, string> = {
  today: 'Today',
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Number of days a range spans. */
export function rangeDays(range: DashboardRange): number {
  return RANGE_DAYS[range];
}

/** Coerce an unknown value to a valid range, falling back to the default. */
export function parseRange(value: string | undefined): DashboardRange {
  return DASHBOARD_RANGES.includes(value as DashboardRange)
    ? (value as DashboardRange)
    : DEFAULT_RANGE;
}

/** Start `Date` for a range, relative to `now`. */
export function rangeToSince(
  range: DashboardRange,
  now: Date = new Date()
): Date {
  return new Date(now.getTime() - rangeDays(range) * DAY_MS);
}
