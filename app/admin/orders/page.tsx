import Link from 'next/link';
import { format } from 'date-fns';
import { listOrders } from '@/lib/shop/admin-orders';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { ORDER_STATUSES } from '@/lib/shop/order-status';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const rows = await listOrders({ status, search: q });

  const pill =
    'rounded-full border border-border px-3 py-1 text-sm transition-colors';

  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>

      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search order #, name, or mark"
          className="h-9 w-72 rounded-md border border-input px-3 text-sm"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button className={cn(pill, 'bg-secondary')}>Search</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(pill, !status ? 'bg-primary text-black' : '')}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={cn(
              pill,
              status === s ? 'bg-primary text-black' : ''
            )}>
            {s}
          </Link>
        ))}
      </div>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Mark</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  {o.orderNumber}
                </Link>
              </TableCell>
              <TableCell>{o.customerName ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {o.shippingMark}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(o.createdAt), 'd MMM yyyy')}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={o.status} />
              </TableCell>
              <TableCell>{formatCedis(o.total)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
