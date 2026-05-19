'use client';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCedis } from '@/lib/shop/money';

type Point = { date: string; revenue: number };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-zinc-500">
        {label ? format(new Date(label), 'd MMM yyyy') : ''}
      </p>
      <p className="text-sm font-semibold text-zinc-900 tabular-nums">
        {formatCedis(payload[0].value)}
      </p>
    </div>
  );
}

/** Daily revenue area chart for the dashboard. */
export function RevenueChart({ data }: { data: Point[] }) {
  const empty = data.every((d) => d.revenue === 0);

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Revenue</h2>
        <span className="text-xs text-zinc-400">Daily, GHS</span>
      </div>
      <div className="mt-4 h-64">
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No revenue in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#e4bb25"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="#e4bb25"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#f1f1f1"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickFormatter={(v: string) => format(new Date(v), 'd MMM')}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fontSize: 11, fill: '#a1a1aa' }}
                tickFormatter={(v: number) => `${Math.round(v / 100)}`}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#e4bb25', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#b8941d"
                strokeWidth={2}
                fill="url(#revFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
