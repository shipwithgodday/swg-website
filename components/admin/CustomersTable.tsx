'use client';

import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { DataTable } from '@/components/admin/ui/data-table';
import { CustomerDetailDialog } from '@/components/admin/CustomerDetailDialog';

export interface CustomerRow {
  id: string;
  shippingMark: string;
  shippingMarkNo: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  orderCount: number;
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
            className="text-primary underline-offset-4 hover:underline">
            {row.original.shippingMark}
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => row.original.name ?? '—',
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
        accessorKey: 'orderCount',
        header: ({ column }) => (
          <SortHeader label="Orders" column={column} />
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
      />

      <CustomerDetailDialog
        customer={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
