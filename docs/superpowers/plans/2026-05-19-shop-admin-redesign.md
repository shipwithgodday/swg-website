# Shop Admin Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the shop admin (`/admin/*`) a modern dark-sidebar / warm-elevated-content identity, fix storefront-themed inputs, capitalize statuses, add table page-size controls, and overhaul the dashboard.

**Architecture:** Add admin-only neutral shadcn primitives under `components/admin/ui/` so the admin stops inheriting the storefront's dark-themed `components/ui/*` (which stay untouched). Add shared DRY helpers (`status-format`, `date-range`), an enhanced `DataTable` with a page-size selector, and rebuild the sidebar, layout, dashboard, and tables.

**Tech Stack:** Next.js 15 (App Router, Server Components), React 19, Tailwind v4, `@tanstack/react-table` v8, `recharts` (new), Drizzle ORM, Jest + ts-jest.

---

## Conventions

- Package manager is **pnpm**. Run commands from repo root `/Users/joel/Documents/lucky-godday`.
- `cn` lives at `@/lib/utils`.
- Jest `testEnvironment` is `node`; `testMatch` is `**/*.test.ts` — unit tests must be `.ts` (not `.tsx`).
- Type-check with `npx tsc --noEmit`. Run tests with `pnpm test`.
- Commit after every task.

---

## Task 1: Add the recharts dependency

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install recharts**

Run: `pnpm add recharts`
Expected: `recharts` appears under `dependencies` in `package.json`; `pnpm-lock.yaml` updates.

- [ ] **Step 2: Verify install**

Run: `node -e "require.resolve('recharts'); console.log('ok')"`
Expected: prints `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add recharts for admin dashboard charts"
```

---

## Task 2: Status formatting helper (TDD)

**Files:**
- Create: `lib/shop/status-format.ts`
- Test: `lib/shop/status-format.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/shop/status-format.test.ts`:

```ts
import {
  titleCase,
  formatOrderStatus,
  formatProductStatus,
} from './status-format';

describe('titleCase', () => {
  it('capitalises each word', () => {
    expect(titleCase('hello world')).toBe('Hello World');
  });
  it('splits on underscores and hyphens', () => {
    expect(titleCase('in_transit-now')).toBe('In Transit Now');
  });
  it('lowercases the rest of each word', () => {
    expect(titleCase('SHIPPED')).toBe('Shipped');
  });
  it('returns empty string unchanged', () => {
    expect(titleCase('')).toBe('');
  });
});

describe('formatOrderStatus', () => {
  it('maps known order statuses to friendly labels', () => {
    expect(formatOrderStatus('pending')).toBe('Pending Payment');
    expect(formatOrderStatus('paid')).toBe('Paid');
    expect(formatOrderStatus('processing')).toBe('Processing');
    expect(formatOrderStatus('shipped')).toBe('Shipped');
    expect(formatOrderStatus('delivered')).toBe('Delivered');
    expect(formatOrderStatus('cancelled')).toBe('Cancelled');
  });
  it('falls back to titleCase for unknown statuses', () => {
    expect(formatOrderStatus('on_hold')).toBe('On Hold');
  });
});

describe('formatProductStatus', () => {
  it('capitalises product statuses', () => {
    expect(formatProductStatus('draft')).toBe('Draft');
    expect(formatProductStatus('active')).toBe('Active');
    expect(formatProductStatus('archived')).toBe('Archived');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- status-format`
Expected: FAIL — cannot find module `./status-format`.

- [ ] **Step 3: Write the implementation**

Create `lib/shop/status-format.ts`:

```ts
/** Capitalises the first letter of each word; splits on spaces, _ and -. */
export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Human label for an order status, e.g. `pending` -> `Pending Payment`. */
export function formatOrderStatus(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? titleCase(status);
}

/** Human label for a product status, e.g. `draft` -> `Draft`. */
export function formatProductStatus(status: string): string {
  return titleCase(status);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- status-format`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/status-format.ts lib/shop/status-format.test.ts
git commit -m "feat: add status formatting helpers"
```

---

## Task 3: Dashboard date-range helper (TDD)

**Files:**
- Create: `lib/shop/date-range.ts`
- Test: `lib/shop/date-range.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/shop/date-range.test.ts`:

```ts
import {
  DASHBOARD_RANGES,
  DEFAULT_RANGE,
  parseRange,
  rangeDays,
  rangeToSince,
} from './date-range';

describe('parseRange', () => {
  it('accepts every valid range key', () => {
    for (const r of DASHBOARD_RANGES) {
      expect(parseRange(r)).toBe(r);
    }
  });
  it('falls back to the default for unknown or missing values', () => {
    expect(parseRange('nonsense')).toBe(DEFAULT_RANGE);
    expect(parseRange(undefined)).toBe(DEFAULT_RANGE);
  });
});

describe('rangeDays', () => {
  it('maps range keys to day counts', () => {
    expect(rangeDays('today')).toBe(1);
    expect(rangeDays('7d')).toBe(7);
    expect(rangeDays('30d')).toBe(30);
    expect(rangeDays('90d')).toBe(90);
  });
});

describe('rangeToSince', () => {
  it('returns a date `rangeDays` before now', () => {
    const now = new Date('2026-05-19T12:00:00.000Z');
    expect(rangeToSince('7d', now).toISOString()).toBe(
      '2026-05-12T12:00:00.000Z'
    );
    expect(rangeToSince('today', now).toISOString()).toBe(
      '2026-05-18T12:00:00.000Z'
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- date-range`
Expected: FAIL — cannot find module `./date-range`.

- [ ] **Step 3: Write the implementation**

Create `lib/shop/date-range.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- date-range`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/shop/date-range.ts lib/shop/date-range.test.ts
git commit -m "feat: add dashboard date-range helpers"
```

---

## Task 4: Admin UI primitives

Neutral shadcn primitives used only by the admin. `components/ui/*` are NOT touched.

**Files:**
- Create: `components/admin/ui/input.tsx`
- Create: `components/admin/ui/textarea.tsx`
- Create: `components/admin/ui/button.tsx`
- Create: `components/admin/ui/select.tsx`

- [ ] **Step 1: Create the input**

Create `components/admin/ui/input.tsx`:

```tsx
import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-900 shadow-xs transition-colors outline-none',
        'placeholder:text-zinc-400',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-zinc-700',
        'focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  );
}

export { Input };
```

- [ ] **Step 2: Create the textarea**

Create `components/admin/ui/textarea.tsx`:

```tsx
import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs transition-colors outline-none',
        'placeholder:text-zinc-400',
        'focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
```

- [ ] **Step 3: Create the button**

Create `components/admin/ui/button.tsx`:

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-900/15 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 text-white shadow-xs hover:bg-zinc-800',
        gold: 'bg-primary text-zinc-900 shadow-xs hover:bg-primary/90',
        outline:
          'border border-zinc-200 bg-white text-zinc-900 shadow-xs hover:bg-zinc-50',
        ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90',
        link: 'text-zinc-900 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

- [ ] **Step 4: Create the select**

Create `components/admin/ui/select.tsx`:

```tsx
'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Select(
  props: React.ComponentProps<typeof SelectPrimitive.Root>
) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup(
  props: React.ComponentProps<typeof SelectPrimitive.Group>
) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue(
  props: React.ComponentProps<typeof SelectPrimitive.Value>
) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-xs outline-none transition-colors whitespace-nowrap",
        'data-[size=default]:h-9 data-[size=sm]:h-8',
        'data-[placeholder]:text-zinc-400',
        'focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10',
        'disabled:cursor-not-allowed disabled:opacity-50',
        "*:data-[slot=select-value]:line-clamp-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-zinc-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-zinc-200 bg-white text-zinc-900 shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1'
          )}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('px-2 py-1.5 text-xs text-zinc-500', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none focus:bg-zinc-100 focus:text-zinc-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}>
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        'pointer-events-none -mx-1 my-1 h-px bg-zinc-200',
        className
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}>
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}>
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS — no new errors from the four new files.

- [ ] **Step 6: Commit**

```bash
git add components/admin/ui/input.tsx components/admin/ui/textarea.tsx components/admin/ui/button.tsx components/admin/ui/select.tsx
git commit -m "feat: add neutral admin UI primitives"
```

---

## Task 5: Enhanced DataTable with page-size control

Move the table from `components/ui/data-table.tsx` to `components/admin/ui/data-table.tsx`, point it at the admin primitives, and add a page-size selector (10 / 25 / 50 / 100 / Show all, default 25) plus a row-count display.

**Files:**
- Create: `components/admin/ui/data-table.tsx`
- Delete: `components/ui/data-table.tsx`

- [ ] **Step 1: Create the enhanced DataTable**

Create `components/admin/ui/data-table.tsx`:

```tsx
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialSorting = [],
  searchable = false,
  searchPlaceholder = 'Search…',
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

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-zinc-50/80 hover:bg-zinc-50/80">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-zinc-100 transition-colors hover:bg-zinc-50/70">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-zinc-700">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
```

- [ ] **Step 2: Delete the old data-table**

Run: `git rm -f components/ui/data-table.tsx 2>/dev/null || rm components/ui/data-table.tsx`
Expected: file removed. (It is currently untracked, so a plain `rm` is fine.)

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: errors ONLY in files still importing `@/components/ui/data-table` (`ProductsTable.tsx`, `CategoriesTable.tsx`, `CustomersTable.tsx`). These are fixed in Tasks 13–14. No other errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/ui/data-table.tsx components/ui/data-table.tsx
git commit -m "feat: enhance DataTable with page-size selector"
```

---

## Task 6: StatusBadge and AdminPageHeader

**Files:**
- Create: `components/admin/StatusBadge.tsx`
- Create: `components/admin/AdminPageHeader.tsx`

- [ ] **Step 1: Create StatusBadge**

Create `components/admin/StatusBadge.tsx`:

```tsx
import { cn } from '@/lib/utils';
import {
  formatOrderStatus,
  formatProductStatus,
} from '@/lib/shop/status-format';

const ORDER_TONES: Record<string, string> = {
  pending: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  paid: 'bg-sky-50 text-sky-700 ring-sky-200',
  processing: 'bg-amber-50 text-amber-800 ring-amber-200',
  shipped: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
};

const PRODUCT_TONES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  draft: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  archived: 'bg-amber-50 text-amber-800 ring-amber-200',
};

const FALLBACK_TONE = 'bg-zinc-100 text-zinc-700 ring-zinc-200';

/** A pill showing a capitalized order or product status with a tone. */
export function StatusBadge({
  status,
  kind,
}: {
  status: string;
  kind: 'order' | 'product';
}) {
  const label =
    kind === 'order'
      ? formatOrderStatus(status)
      : formatProductStatus(status);
  const tone =
    (kind === 'order' ? ORDER_TONES : PRODUCT_TONES)[status] ??
    FALLBACK_TONE;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tone
      )}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Create AdminPageHeader**

Create `components/admin/AdminPageHeader.tsx`:

```tsx
import type { ReactNode } from 'react';

/** Standard page header: title, optional description, optional action slot. */
export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors from these two files (pre-existing errors from Task 5 remain until Tasks 13–14).

- [ ] **Step 4: Commit**

```bash
git add components/admin/StatusBadge.tsx components/admin/AdminPageHeader.tsx
git commit -m "feat: add StatusBadge and AdminPageHeader components"
```

---

## Task 7: Rebuild StatCard

**Files:**
- Modify: `components/admin/StatCard.tsx` (full rewrite)

- [ ] **Step 1: Rewrite StatCard**

Replace the entire contents of `components/admin/StatCard.tsx`:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: errors ONLY the pre-existing data-table import errors (Task 5). `app/admin/page.tsx` still uses the old `StatCard` props (`label`, `value`, `hint`) which remain valid, so no new error there.

- [ ] **Step 3: Commit**

```bash
git add components/admin/StatCard.tsx
git commit -m "feat: redesign StatCard with icon, accent, and delta"
```

---

## Task 8: Rebuild AdminSidebar and admin layout

**Files:**
- Modify: `components/admin/AdminSidebar.tsx` (full rewrite)
- Modify: `app/admin/layout.tsx` (full rewrite)

- [ ] **Step 1: Rewrite AdminSidebar**

Replace the entire contents of `components/admin/AdminSidebar.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderTree,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const NAV = [
  {
    section: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    ],
  },
  {
    section: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    section: 'Settings',
    items: [
      {
        href: '/admin/settings/delivery-zones',
        label: 'Delivery zones',
        icon: Truck,
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-zinc-950 text-zinc-400">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-zinc-950">
          <span className="text-sm font-bold">G</span>
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Godday</p>
          <p className="text-xs text-zinc-500">Shop admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
              {group.section}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-zinc-950'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    )}>
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-900 px-5 py-4">
        <p className="text-xs text-zinc-600">Lucky Godday Business Services</p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Rewrite the admin layout**

Replace the entire contents of `app/admin/layout.tsx`:

```tsx
import { requireAdmin } from '@/lib/shop/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen bg-[#faf9f7]">
      <AdminSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: only the pre-existing data-table import errors (Task 5). No new errors.

- [ ] **Step 4: Manual check**

Run: `pnpm dev`, open `/admin`. Expected: dark sidebar, gold active item, warm off-white content background, no orange.

- [ ] **Step 5: Commit**

```bash
git add components/admin/AdminSidebar.tsx app/admin/layout.tsx
git commit -m "feat: redesign admin sidebar and layout"
```

---

## Task 9: Dashboard data layer

Make dashboard metrics range-aware and add revenue-series and top-products queries.

**Files:**
- Modify: `lib/shop/admin-dashboard.ts` (full rewrite)

- [ ] **Step 1: Rewrite admin-dashboard.ts**

Replace the entire contents of `lib/shop/admin-dashboard.ts`:

```ts
import { and, desc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  customers,
  products,
  productVariants,
} from '@/lib/db/schema';
import {
  rangeDays,
  rangeToSince,
  type DashboardRange,
} from '@/lib/shop/date-range';

// Statuses that count as real revenue.
const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

const LOW_STOCK_THRESHOLD = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Percentage change from `prev` to `curr`. */
function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/** Revenue + order count for orders created in [start, end). */
async function salesBetween(start: Date, end?: Date) {
  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, start),
        ...(end ? [lt(orders.createdAt, end)] : [])
      )
    );
  return {
    revenue: Number(row?.revenue ?? 0),
    count: Number(row?.count ?? 0),
  };
}

/** Range-aware KPIs with deltas vs. the preceding equal-length period. */
export async function getDashboardMetrics(range: DashboardRange) {
  const now = new Date();
  const since = rangeToSince(range, now);
  const prevSince = new Date(since.getTime() - rangeDays(range) * DAY_MS);

  const [
    current,
    previous,
    attention,
    customerCount,
    recentOrders,
    lowStock,
  ] = await Promise.all([
    salesBetween(since),
    salesBetween(prevSince, since),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.status, ['paid', 'processing'])),
    db.select({ count: sql<number>`count(*)` }).from(customers),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8),
    db
      .select({
        id: productVariants.id,
        variantName: productVariants.name,
        stock: productVariants.stockQuantity,
        productName: products.name,
        productId: products.id,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(lte(productVariants.stockQuantity, LOW_STOCK_THRESHOLD))
      .orderBy(productVariants.stockQuantity)
      .limit(8),
  ]);

  const aov =
    current.count > 0 ? Math.round(current.revenue / current.count) : 0;
  const prevAov =
    previous.count > 0
      ? Math.round(previous.revenue / previous.count)
      : 0;

  return {
    revenue: {
      value: current.revenue,
      delta: pctChange(current.revenue, previous.revenue),
    },
    orders: {
      value: current.count,
      delta: pctChange(current.count, previous.count),
    },
    aov: { value: aov, delta: pctChange(aov, prevAov) },
    ordersNeedingAttention: Number(attention[0]?.count ?? 0),
    customerCount: Number(customerCount[0]?.count ?? 0),
    recentOrders,
    lowStock,
  };
}

/** Daily revenue buckets across the range, zero-filled for empty days. */
export async function getRevenueSeries(range: DashboardRange) {
  const now = new Date();
  const since = rangeToSince(range, now);

  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, since)
      )
    )
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`);

  const byDay = new Map(rows.map((r) => [r.day, Number(r.revenue)]));
  const series: { date: string; revenue: number }[] = [];
  for (let i = rangeDays(range) - 1; i >= 0; i--) {
    const key = new Date(now.getTime() - i * DAY_MS)
      .toISOString()
      .slice(0, 10);
    series.push({ date: key, revenue: byDay.get(key) ?? 0 });
  }
  return series;
}

/** Best-selling products (by revenue) within the range. */
export async function getTopProducts(range: DashboardRange, limit = 5) {
  const since = rangeToSince(range);
  const rows = await db
    .select({
      name: orderItems.productName,
      units: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(${orderItems.unitPrice} * ${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        inArray(orders.status, REVENUE_STATUSES),
        gte(orders.createdAt, since)
      )
    )
    .groupBy(orderItems.productName)
    .orderBy(
      desc(sql`sum(${orderItems.unitPrice} * ${orderItems.quantity})`)
    )
    .limit(limit);

  return rows.map((r) => ({
    name: r.name,
    units: Number(r.units),
    revenue: Number(r.revenue),
  }));
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: pre-existing data-table errors PLUS a new error in `app/admin/page.tsx` (it calls `getDashboardMetrics()` with no argument and uses the old return shape). This is expected — `app/admin/page.tsx` is rewritten in Task 11.

- [ ] **Step 3: Commit**

```bash
git add lib/shop/admin-dashboard.ts
git commit -m "feat: make dashboard queries range-aware; add series and top products"
```

---

## Task 10: DateRangeTabs, RevenueChart, TopProducts

**Files:**
- Create: `components/admin/DateRangeTabs.tsx`
- Create: `components/admin/RevenueChart.tsx`
- Create: `components/admin/TopProducts.tsx`

- [ ] **Step 1: Create DateRangeTabs**

Create `components/admin/DateRangeTabs.tsx`:

```tsx
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
```

- [ ] **Step 2: Create RevenueChart**

Create `components/admin/RevenueChart.tsx`:

```tsx
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
```

- [ ] **Step 3: Create TopProducts**

Create `components/admin/TopProducts.tsx`:

```tsx
import { formatCedis } from '@/lib/shop/money';

type TopProduct = { name: string; units: number; revenue: number };

/** Best-selling products panel for the dashboard. */
export function TopProducts({ products }: { products: TopProduct[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Top products</h2>
      {products.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-400">
          No sales in this period yet.
        </p>
      ) : (
        <ol className="mt-4 space-y-1">
          {products.map((p, i) => (
            <li
              key={p.name}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50">
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600 tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                {p.name}
              </span>
              <span className="text-xs text-zinc-400 tabular-nums">
                {p.units} sold
              </span>
              <span className="text-sm font-medium text-zinc-900 tabular-nums">
                {formatCedis(p.revenue)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: same as Task 9 (data-table errors + the `app/admin/page.tsx` error). No new errors from the three new files.

- [ ] **Step 5: Commit**

```bash
git add components/admin/DateRangeTabs.tsx components/admin/RevenueChart.tsx components/admin/TopProducts.tsx
git commit -m "feat: add dashboard range tabs, revenue chart, top products"
```

---

## Task 11: Rebuild the dashboard page

**Files:**
- Modify: `app/admin/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the dashboard page**

Replace the entire contents of `app/admin/page.tsx`:

```tsx
import Link from 'next/link';
import { format } from 'date-fns';
import { Banknote, ShoppingBag, Receipt, AlertCircle } from 'lucide-react';

import {
  getDashboardMetrics,
  getRevenueSeries,
  getTopProducts,
} from '@/lib/shop/admin-dashboard';
import { parseRange } from '@/lib/shop/date-range';
import { formatCedis } from '@/lib/shop/money';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DateRangeTabs } from '@/components/admin/DateRangeTabs';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { TopProducts } from '@/components/admin/TopProducts';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);
  const [metrics, series, topProducts] = await Promise.all([
    getDashboardMetrics(range),
    getRevenueSeries(range),
    getTopProducts(range, 5),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Sales performance and what needs attention.">
        <DateRangeTabs />
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCedis(metrics.revenue.value)}
          delta={metrics.revenue.delta}
          icon={Banknote}
          accent
        />
        <StatCard
          label="Orders"
          value={String(metrics.orders.value)}
          delta={metrics.orders.delta}
          icon={ShoppingBag}
        />
        <StatCard
          label="Avg order value"
          value={formatCedis(metrics.aov.value)}
          delta={metrics.aov.delta}
          icon={Receipt}
        />
        <StatCard
          label="Needs attention"
          value={String(metrics.ordersNeedingAttention)}
          hint="paid / processing"
          icon={AlertCircle}
        />
      </div>

      <RevenueChart data={series} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProducts products={topProducts} />

        <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">
            Recent orders
          </h2>
          <div className="mt-4 space-y-1">
            {metrics.recentOrders.length === 0 && (
              <p className="text-sm text-zinc-400">No orders yet.</p>
            )}
            {metrics.recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50">
                <span className="font-medium text-zinc-900">
                  {o.orderNumber}
                </span>
                <span className="text-xs text-zinc-400">
                  {format(new Date(o.createdAt), 'd MMM')}
                </span>
                <span className="ml-auto">
                  <StatusBadge status={o.status} kind="order" />
                </span>
                <span className="w-24 text-right font-medium text-zinc-900 tabular-nums">
                  {formatCedis(o.total)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Low stock</h2>
        <div className="mt-4 space-y-1">
          {metrics.lowStock.length === 0 && (
            <p className="text-sm text-zinc-400">Nothing low on stock.</p>
          )}
          {metrics.lowStock.map((v) => (
            <Link
              key={v.id}
              href={`/admin/products?edit=${v.productId}`}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-50">
              <span className="text-sm text-zinc-800">
                {v.productName}{' '}
                <span className="text-zinc-400">({v.variantName})</span>
              </span>
              <span className="ml-auto text-sm font-medium text-zinc-900 tabular-nums">
                {v.stock} left
              </span>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-sm text-zinc-400">
        {metrics.customerCount} customers total.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: ONLY the pre-existing data-table import errors remain (Tasks 13–14 fix those). The `app/admin/page.tsx` error from Task 9 is now gone.

- [ ] **Step 3: Manual check**

Run `pnpm dev`, open `/admin`. Expected: KPI cards with deltas, revenue chart renders, range tabs switch data, top products and lists show. Try each range.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: overhaul admin dashboard with chart and range filter"
```

---

## Task 12: OrdersTable and orders page

**Files:**
- Create: `components/admin/OrdersTable.tsx`
- Modify: `app/admin/orders/page.tsx` (full rewrite)

- [ ] **Step 1: Create OrdersTable**

Create `components/admin/OrdersTable.tsx`:

```tsx
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
```

- [ ] **Step 2: Rewrite the orders page**

Replace the entire contents of `app/admin/orders/page.tsx`:

```tsx
import { listOrders } from '@/lib/shop/admin-orders';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { OrdersTable } from '@/components/admin/OrdersTable';

export default async function AdminOrdersPage() {
  const rows = await listOrders({});

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Every order placed in the shop."
      />
      <OrdersTable orders={rows} />
    </div>
  );
}
```

- [ ] **Step 3: Verify `listOrders` accepts an empty filter**

Run: `grep -n "export async function listOrders" lib/shop/admin-orders.ts`
Expected: signature takes a single options object with optional `status` / `search`. Calling `listOrders({})` returns all orders. If the parameter is required and non-optional, pass `listOrders({ status: undefined, search: undefined })` instead.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: only the pre-existing data-table errors in `ProductsTable.tsx`, `CategoriesTable.tsx`, `CustomersTable.tsx` (fixed in Tasks 13–14).

- [ ] **Step 5: Manual check**

Open `/admin/orders`. Expected: capitalized status filter pills, search, page-size selector, capitalized status badges in the table.

- [ ] **Step 6: Commit**

```bash
git add components/admin/OrdersTable.tsx app/admin/orders/page.tsx
git commit -m "feat: redesign orders page with filter pills and data table"
```

---

## Task 13: Update ProductsTable

Capitalize the status column, use `StatusBadge`, and point imports at the admin primitives.

**Files:**
- Modify: `components/admin/ProductsTable.tsx`

- [ ] **Step 1: Update imports**

In `components/admin/ProductsTable.tsx`, change these import lines:

- `import { Button } from '@/components/ui/button';` → `import { Button } from '@/components/admin/ui/button';`
- `import { DataTable } from '@/components/ui/data-table';` → `import { DataTable } from '@/components/admin/ui/data-table';`
- Remove `import { Badge } from '@/components/ui/badge';`
- Add `import { StatusBadge } from '@/components/admin/StatusBadge';`

(Leave the `Dialog*` imports from `@/components/ui/dialog` unchanged — Dialog is neutral.)

- [ ] **Step 2: Replace the status column cell**

In the `columns` array, replace the `status` column object:

```tsx
      {
        accessorKey: 'status',
        header: ({ column }) => <SortHeader label="Status" column={column} />,
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} kind="product" />
        ),
      },
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: data-table errors only in `CategoriesTable.tsx` and `CustomersTable.tsx` now (ProductsTable resolved).

- [ ] **Step 4: Manual check**

Open `/admin/products`. Expected: status column shows "Active" / "Draft" / "Archived" as toned pills; page-size selector present; no orange button hover.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ProductsTable.tsx
git commit -m "feat: capitalize product status and restyle products table"
```

---

## Task 14: Update Categories and Customers tables

Point their `DataTable` and `Button` imports at the admin primitives.

**Files:**
- Modify: `components/admin/CategoriesTable.tsx`
- Modify: `components/admin/CustomersTable.tsx`

- [ ] **Step 1: Inspect current imports**

Run: `grep -n "@/components/ui/\(data-table\|button\)" components/admin/CategoriesTable.tsx components/admin/CustomersTable.tsx`
Expected: lists the import lines that need changing.

- [ ] **Step 2: Update CategoriesTable imports**

In `components/admin/CategoriesTable.tsx`, change any matched lines:

- `@/components/ui/data-table` → `@/components/admin/ui/data-table`
- `@/components/ui/button` → `@/components/admin/ui/button`

(Leave Dialog, Badge, and other `@/components/ui/*` imports unchanged.)

- [ ] **Step 3: Update CustomersTable imports**

In `components/admin/CustomersTable.tsx`, apply the same two replacements as Step 2.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS — no remaining `@/components/ui/data-table` errors. Clean.

- [ ] **Step 5: Manual check**

Open `/admin/categories` and `/admin/customers`. Expected: both tables have the page-size selector and neutral buttons.

- [ ] **Step 6: Commit**

```bash
git add components/admin/CategoriesTable.tsx components/admin/CustomersTable.tsx
git commit -m "feat: point category and customer tables at admin primitives"
```

---

## Task 15: Re-point admin forms and dialogs to admin primitives

These admin components currently import `Input` / `Select` / `Textarea` / `Button` from `@/components/ui/*` (storefront-themed). Re-point them to `@/components/admin/ui/*`.

**Files:**
- Modify: `components/admin/ProductForm.tsx`
- Modify: `components/admin/CategoryForm.tsx`
- Modify: `components/admin/CustomerEditForm.tsx`
- Modify: `components/admin/VariantEditor.tsx`
- Modify: `components/admin/DeliveryZonesEditor.tsx`
- Modify: `components/admin/NewCustomerDialog.tsx`
- Modify: `components/admin/ProductImageField.tsx`
- Modify: `components/admin/OrderStatusUpdater.tsx`
- Modify: `components/admin/CategoryDialog.tsx`
- Modify: `components/admin/CustomerDetailDialog.tsx`

- [ ] **Step 1: Find every affected import**

Run:
```bash
grep -rn "@/components/ui/\(input\|select\|textarea\|button\)" components/admin
```
Expected: a list of import lines across the files above (and possibly others). Use the actual output as the authoritative list.

- [ ] **Step 2: Re-point each import**

For every line found in Step 1, change the module path only (named imports stay the same):

- `@/components/ui/input` → `@/components/admin/ui/input`
- `@/components/ui/select` → `@/components/admin/ui/select`
- `@/components/ui/textarea` → `@/components/admin/ui/textarea`
- `@/components/ui/button` → `@/components/admin/ui/button`

Do NOT change `@/components/ui/{dialog,sheet,label,checkbox,card,table,badge,alert,dropdown-menu}` — those are neutral and shared.

Note: the admin `Button` has variants `default | gold | outline | ghost | destructive | link`. If any admin call site used a now-removed variant, map it: a primary/brand button becomes `variant="gold"`; everything else keeps its name. The storefront `default` was gold — if a call site relied on that gold look for its main CTA, switch it to `variant="gold"`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS — clean, no errors.

- [ ] **Step 4: Manual check**

Open `/admin/products` (New product sheet), `/admin/categories` (category dialog), `/admin/customers` (new customer dialog), `/admin/settings/delivery-zones`. Expected: all inputs have full rounded borders on white, selects open white popovers (no blue), no bottom-border-only fields.

- [ ] **Step 5: Commit**

```bash
git add components/admin
git commit -m "feat: point admin forms and dialogs at admin UI primitives"
```

---

## Task 16: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the test suite**

Run: `pnpm test`
Expected: PASS — all tests green, including the new `status-format` and `date-range` suites.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS — no errors.

- [ ] **Step 3: Lint**

Run: `pnpm lint`
Expected: PASS — no new lint errors in changed files.

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Visual pass with dev server**

Run: `pnpm dev`. Walk every admin route:
- `/admin` — dark sidebar, gold active item, KPI cards with deltas, revenue chart, range tabs, top products, lists.
- `/admin/orders` — capitalized filter pills, search, page-size selector, capitalized status badges.
- `/admin/orders/[id]` — opens without errors.
- `/admin/products` — capitalized status pills, page-size selector.
- `/admin/categories`, `/admin/customers` — page-size selectors, neutral buttons.
- `/admin/settings/delivery-zones` — bordered inputs.
- Confirm: no orange anywhere, no blue dropdowns, no bottom-border-only inputs.

- [ ] **Step 6: Confirm storefront untouched**

Run: `git diff --name-only main -- components/ui app/signup app/email components/contact components/schedule components/shop`
Expected: empty output — no storefront files changed.

- [ ] **Step 7: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "chore: final verification fixes for admin redesign"
```

(Skip if Steps 1–6 all passed with no changes.)

---

## Notes for the implementer

- **Storefront is off-limits.** Never edit `components/ui/*` or storefront pages. The admin gets its own primitives under `components/admin/ui/`.
- **`StatCard`** is consumed only by the dashboard; the rewrite in Task 7 is backward-compatible with the old call signature (extra props are optional) so the build stays green between Tasks 7 and 11.
- **Intermediate build state:** after Task 9 the dashboard page has a type error until Task 11; after Task 5 the three table components have import errors until Tasks 13–14. Both are called out in the relevant tasks — do not "fix" them out of order.
- **`recharts`** types ship with the package; no `@types/recharts` needed.
