'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, ImageOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/admin/ui/button';
import { DataTable } from '@/components/admin/ui/data-table';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { formatProductStatus } from '@/lib/shop/status-format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductSheet } from '@/components/admin/ProductSheet';
import type { ProductFormValue } from '@/components/admin/ProductForm';
import { deleteProduct } from '@/app/actions/shop/products';

export type AdminProduct = ProductFormValue & {
  categoryName: string | null;
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

export function ProductsTable({
  products,
  categories,
}: {
  products: AdminProduct[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [pending, startDelete] = useTransition();

  function startCreate() {
    setEditing(null);
    setOpen(true);
  }

  function startEdit(product: AdminProduct) {
    setEditing(product);
    setOpen(true);
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteProduct(target.id);
      if (res.ok) {
        toast.success('Product deleted');
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  // Deep link support: /admin/products?edit=<id> opens that product.
  useEffect(() => {
    const id = searchParams.get('edit');
    if (!id) return;
    const match = products.find((p) => p.id === id);
    if (match) startEdit(match);
  }, [searchParams, products]);

  const columns = useMemo<ColumnDef<AdminProduct>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortHeader label="Name" column={column} />,
        cell: ({ row }) => {
          const thumb = row.original.images[0]?.url;
          return (
            <button
              type="button"
              onClick={() => startEdit(row.original)}
              className="group flex items-center gap-3 text-left">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200"
                />
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200">
                  <ImageOff className="size-4" />
                </span>
              )}
              <span className="font-medium text-zinc-900 underline-offset-4 group-hover:text-zinc-500 group-hover:underline">
                {row.original.name}
              </span>
            </button>
          );
        },
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.categoryName ?? '—'}
          </span>
        ),
      },
      {
        id: 'status',
        // Filter/sort on the displayed label so search matches what the user
        // sees ("Active", "Archived"), not the raw status value.
        accessorFn: (row) => formatProductStatus(row.status),
        header: ({ column }) => <SortHeader label="Status" column={column} />,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} kind="product" />
        ),
      },
      {
        id: 'variants',
        header: 'Variants',
        enableGlobalFilter: false,
        cell: ({ row }) => row.original.variants.length,
      },
      {
        id: 'images',
        header: 'Images',
        enableGlobalFilter: false,
        cell: ({ row }) => row.original.images.length,
      },
      {
        id: 'actions',
        header: '',
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit(row.original)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleting(row.original)}
              aria-label={`Delete ${row.original.name}`}>
              <Trash2 className="h-3.5 w-3.5" />
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
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button onClick={startCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New product
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={products}
          searchable
          searchPlaceholder="Search by name, category, or status"
          initialSorting={[{ id: 'name', desc: false }]}
        />
      </div>

      <ProductSheet
        categories={categories}
        product={editing ?? undefined}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
      />

      <Dialog
        open={!!deleting}
        onOpenChange={(next) => {
          if (!next && !pending) setDeleting(null);
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
            <DialogDescription>
              Delete <strong>{deleting?.name}</strong>? Its variants and
              images are removed too. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={pending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}>
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
