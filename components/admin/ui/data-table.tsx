'use client';

import { useState } from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/admin/ui/input';
import { Button } from '@/components/admin/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;
const SHOW_ALL = 'all';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Initial sort state. */
  initialSorting?: SortingState;
  /** Show a search box that filters across all columns. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /**
   * Fired when the user clicks anywhere on a row that isn't itself an
   * interactive element (button, anchor, input, label). Lets the whole
   * row act as the primary action while keeping in-cell controls (Edit,
   * Delete, the first-column link) working on their own.
   */
  onRowClick?: (row: TData) => void;
}

/** Closest-ancestor selector for elements that should swallow row clicks. */
const INTERACTIVE_SELECTOR =
  'a, button, input, label, select, textarea, [role="button"], [role="checkbox"], [data-stop-row-click]';

export function DataTable<TData, TValue>({
  columns,
  data,
  initialSorting = [],
  searchable = false,
  searchPlaceholder = 'Search…',
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSizeValue, setPageSizeValue] = useState(
    String(DEFAULT_PAGE_SIZE)
  );

  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize: DEFAULT_PAGE_SIZE } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
  });

  function changePageSize(value: string) {
    setPageSizeValue(value);
    table.setPageSize(
      value === SHOW_ALL ? Math.max(data.length, 1) : Number(value)
    );
  }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const firstRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min(filteredCount, (pageIndex + 1) * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {searchable ? (
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Rows per page</span>
          <Select value={pageSizeValue} onValueChange={changePageSize}>
            <SelectTrigger size="sm" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
              <SelectItem value={SHOW_ALL}>Show all</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <Table className="min-w-[640px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-zinc-50/80 hover:bg-zinc-50/80">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const clickable = !!onRowClick;
                return (
                  <TableRow
                    key={row.id}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={
                      clickable
                        ? (e) => {
                            // Don't fire the row action when the user
                            // clicked something interactive inside the
                            // row (the first-cell link, Edit, Delete).
                            const t = e.target as HTMLElement;
                            if (t.closest(INTERACTIVE_SELECTOR)) return;
                            onRowClick(row.original);
                          }
                        : undefined
                    }
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            const t = e.target as HTMLElement;
                            if (t.closest(INTERACTIVE_SELECTOR)) return;
                            e.preventDefault();
                            onRowClick(row.original);
                          }
                        : undefined
                    }
                    className={
                      clickable
                        ? 'cursor-pointer border-zinc-100 transition-colors hover:bg-zinc-50/70 focus-visible:bg-zinc-50/70 focus-visible:outline-none'
                        : 'border-zinc-100 transition-colors hover:bg-zinc-50/70'
                    }>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3.5 text-zinc-700">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-zinc-400">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-500 tabular-nums">
          {filteredCount === 0
            ? 'No rows'
            : `Showing ${firstRow}–${lastRow} of ${filteredCount}`}
        </p>
        {table.getPageCount() > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">
              Page {pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
