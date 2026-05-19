'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { type ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/admin/ui/data-table';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatCedis } from '@/lib/shop/money';
import { formatOrderStatus } from '@/lib/shop/status-format';
import { ORDER_STATUSES } from '@/lib/shop/order-status';
import { cn } from '@/lib/utils';

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  shippingMark: string | null;
  createdAt: string | Date;
  status: string;
  total: number;
};

const FILTERS = ['all', ...ORDER_STATUSES] as const;

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const rows = useMemo(
    () =>
      statusFilter === 'all'
        ? orders
        : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  const columns = useMemo<ColumnDef<AdminOrderRow>[]>(
    () => [
      {
        accessorKey: 'orderNumber',
        header: 'Order',
        cell: ({ row }) => (
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            {row.original.orderNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => row.original.customerName ?? '—',
      },
      {
        accessorKey: 'shippingMark',
        header: 'Mark',
        cell: ({ row }) => (
          <span className="text-zinc-500">
            {row.original.shippingMark ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-zinc-500">
            {format(new Date(row.original.createdAt), 'd MMM yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} kind="order" />
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-medium text-zinc-900 tabular-nums">
            {formatCedis(row.original.total)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            className={cn(
              'cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === f
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900'
            )}>
            {f === 'all' ? 'All' : formatOrderStatus(f)}
          </button>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchable
        searchPlaceholder="Search order #, customer, or mark"
        initialSorting={[{ id: 'createdAt', desc: true }]}
      />
    </div>
  );
}
