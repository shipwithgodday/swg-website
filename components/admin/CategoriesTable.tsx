'use client';
import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { DataTable } from '@/components/admin/ui/data-table';
import { CategoryDialog } from '@/components/admin/CategoryDialog';
import type { CategoryFormValue } from '@/components/admin/CategoryForm';

export type AdminCategory = CategoryFormValue & {
  slug: string;
  productCount: number;
};

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

export function CategoriesTable({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  function startCreate() {
    setEditing(null);
    setOpen(true);
  }

  function startEdit(category: AdminCategory) {
    setEditing(category);
    setOpen(true);
  }

  const columns = useMemo<ColumnDef<AdminCategory>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortHeader label="Name" column={column} />,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => startEdit(row.original)}
            className="font-medium text-zinc-900 underline-offset-4 hover:text-zinc-500 hover:underline">
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.slug}</span>
        ),
      },
      {
        id: 'products',
        header: 'Products',
        enableGlobalFilter: false,
        cell: ({ row }) => row.original.productCount,
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
              onClick={() => startEdit(row.original)}>
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
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button onClick={startCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New category
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={categories}
          searchable
          searchPlaceholder="Search by name or slug"
          initialSorting={[{ id: 'name', desc: false }]}
        />
      </div>

      <CategoryDialog
        category={editing ?? undefined}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
      />
    </div>
  );
}
