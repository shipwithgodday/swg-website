import Link from 'next/link';
import { cn } from '@/lib/utils';
import { listCustomers } from '@/lib/shop/admin-customers';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rows = await listCustomers(q);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Customers</h1>

      <form className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Search name, mark, email, or phone"
          className="h-9 w-80 rounded-md border border-input px-3 text-sm"
        />
        <button
          className={cn(
            'rounded-full border border-border bg-secondary px-3 py-1 text-sm'
          )}>
          Search
        </button>
      </form>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Mark</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  {c.shippingMark}
                </Link>
              </TableCell>
              <TableCell>{c.name ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {c.email ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {c.phone ?? '—'}
              </TableCell>
              <TableCell>{c.orderCount}</TableCell>
              <TableCell>
                <Badge variant="secondary">{c.source}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                No customers found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
