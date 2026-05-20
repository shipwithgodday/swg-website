'use client';

import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ArrowUpDown, Pencil } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { DataTable } from '@/components/admin/ui/data-table';
import { CustomerDetailDialog } from '@/components/admin/CustomerDetailDialog';
import { formatCedis } from '@/lib/shop/money';

export interface CustomerRow {
  id: string;
  shippingMark: string;
  shippingMarkNo: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  createdAt: Date;
  orderCount: number;
  lifetimeSpend: number;
  lastOrderAt: Date | null;
}

function SortHeader({
  label,
  column,
}: {
  label: string;
  column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => unknown };
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
      {label}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
    </Button>
  );
}

export function CustomersTable({
  customers,
}: {
  customers: CustomerRow[];
}) {
  const [editing, setEditing] = useState<CustomerRow | null>(null);

  const columns = useMemo<ColumnDef<CustomerRow>[]>(
    () => [
      {
        accessorKey: 'shippingMark',
        header: ({ column }) => (
          <SortHeader label="Mark" column={column} />
        ),
        sortingFn: (a, b) =>
          a.original.shippingMarkNo - b.original.shippingMarkNo,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setEditing(row.original)}
            className="font-medium text-zinc-900 underline-offset-4 hover:text-zinc-500 hover:underline">
            {row.original.shippingMark}
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <SortHeader label="Name" column={column} />
        ),
        // Treat empty names as a separate bucket at the end instead of
        // sorting them alphabetically among real values.
        sortingFn: (a, b) => {
          const an = a.original.name?.trim() ?? '';
          const bn = b.original.name?.trim() ?? '';
          if (!an && !bn) return 0;
          if (!an) return 1;
          if (!bn) return -1;
          return an.localeCompare(bn);
        },
        cell: ({ row }) =>
          row.original.source === 'deleted' ? (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-inset ring-zinc-200">
              Deleted customer
            </span>
          ) : (
            (row.original.name ?? '—')
          ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.email ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.phone ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <SortHeader label="Joined" column={column} />
        ),
        sortingFn: (a, b) =>
          a.original.createdAt.getTime() - b.original.createdAt.getTime(),
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {format(row.original.createdAt, 'd MMM yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'orderCount',
        header: ({ column }) => (
          <SortHeader label="Orders" column={column} />
        ),
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.orderCount}</span>
        ),
      },
      {
        accessorKey: 'lifetimeSpend',
        header: ({ column }) => (
          <SortHeader label="Spend" column={column} />
        ),
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <span
            className={
              row.original.lifetimeSpend > 0
                ? 'font-medium text-zinc-900 tabular-nums'
                : 'text-muted-foreground tabular-nums'
            }>
            {formatCedis(row.original.lifetimeSpend)}
          </span>
        ),
      },
      {
        accessorKey: 'lastOrderAt',
        header: ({ column }) => (
          <SortHeader label="Last order" column={column} />
        ),
        // Customers with no orders sort to the bottom on ascending and
        // top on descending (TanStack does this via undefined/null
        // handling when we feed numbers).
        sortingFn: (a, b) => {
          const at = a.original.lastOrderAt?.getTime() ?? -Infinity;
          const bt = b.original.lastOrderAt?.getTime() ?? -Infinity;
          return at - bt;
        },
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.lastOrderAt ? (
            <span className="text-muted-foreground tabular-nums">
              {format(row.original.lastOrderAt, 'd MMM yyyy')}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'actions',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(row.original)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={customers}
        searchable
        searchPlaceholder="Search name, mark, email, or phone"
        initialSorting={[{ id: 'shippingMark', desc: false }]}
        onRowClick={(c) => setEditing(c)}
      />

      <CustomerDetailDialog
        customer={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
