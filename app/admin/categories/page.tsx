import Link from 'next/link';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function CategoriesPage() {
  const rows = await db.query.categories.findMany({
    orderBy: (c, { asc }) => asc(c.name),
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button asChild>
          <Link href="/admin/categories/new">New category</Link>
        </Button>
      </div>
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {c.slug}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/admin/categories/${c.id}`}
                  className="text-primary underline-offset-4 hover:underline">
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted-foreground">
                No categories yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
