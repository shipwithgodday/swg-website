import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function ProductsPage() {
  const rows = await db.query.products.findMany({
    with: { variants: true, category: true },
    orderBy: (p, { desc }) => desc(p.createdAt),
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">New product</Link>
        </Button>
      </div>
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Variants</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {p.category?.name ?? '—'}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    p.status === 'active' ? 'default' : 'secondary'
                  }>
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell>{p.variants.length}</TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No products yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
