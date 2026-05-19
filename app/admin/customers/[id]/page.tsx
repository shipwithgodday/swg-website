import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  getAdminCustomer,
  listMergeCandidates,
} from '@/lib/shop/admin-customers';
import { formatCedis } from '@/lib/shop/money';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { CustomerEditForm } from '@/components/admin/CustomerEditForm';
import { MergeCustomerDialog } from '@/components/admin/MergeCustomerDialog';

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminCustomer(id);
  if (!data) notFound();
  const { customer, orders } = data;
  const candidates = await listMergeCandidates(id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {customer.name ?? customer.shippingMark}
        </h1>
        <p className="text-sm text-muted-foreground">
          Shipping mark {customer.shippingMark} ·{' '}
          {customer.clerkUserId ? 'Account linked' : 'No account'} ·{' '}
          {customer.source}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-3 text-sm font-medium">Contact details</h2>
          <CustomerEditForm
            customer={{
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
            }}
          />
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-sm font-medium">Merge duplicates</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              If this customer also exists under another shipping mark,
              merge that record into this one.
            </p>
            <MergeCustomerDialog
              survivorId={customer.id}
              survivorMark={customer.shippingMark}
              candidates={candidates}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">
          Orders ({orders.length})
        </h2>
        <div className="space-y-2">
          {orders.length === 0 && (
            <p className="text-sm text-muted-foreground">No orders.</p>
          )}
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent">
              <span className="font-medium">{o.orderNumber}</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(o.createdAt), 'd MMM yyyy')}
              </span>
              <OrderStatusBadge status={o.status} />
              <span className="font-medium">
                {formatCedis(o.total)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
