'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/admin/ui/button';
import { CustomerEditForm } from '@/components/admin/CustomerEditForm';
import { OrderStatusBadge } from '@/components/shop/OrderStatusBadge';
import { formatCedis } from '@/lib/shop/money';
import {
  getCustomerDetail,
  mergeCustomers,
  type CustomerDetail,
} from '@/app/actions/shop/admin-customers';
import type { CustomerRow } from '@/components/admin/CustomersTable';

/**
 * Single modal for one customer: edit contact details, view order
 * history, and merge in a duplicate record.
 */
export function CustomerDetailDialog({
  customer,
  onClose,
}: {
  customer: CustomerRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [mergedId, setMergedId] = useState('');
  const [merging, startMerge] = useTransition();

  useEffect(() => {
    if (!customer) {
      setDetail(null);
      setMergedId('');
      return;
    }
    let active = true;
    setLoading(true);
    getCustomerDetail(customer.id).then((d) => {
      if (!active) return;
      setDetail(d);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [customer]);

  function doMerge() {
    if (!customer || !mergedId) return;
    startMerge(async () => {
      const res = await mergeCustomers(customer.id, mergedId);
      if (res.ok) {
        toast.success('Customers merged');
        setMergedId('');
        router.refresh();
        const refreshed = await getCustomerDetail(customer.id);
        setDetail(refreshed);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog
      open={!!customer}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {customer?.name ?? customer?.shippingMark ?? 'Customer'}
          </DialogTitle>
        </DialogHeader>

        {customer && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Shipping mark {customer.shippingMark}
              {detail
                ? ` · ${
                    detail.accountLinked
                      ? 'Account linked'
                      : 'No account'
                  }`
                : ''}
            </p>

            <section>
              <h3 className="mb-2 text-sm font-medium">
                Contact details
              </h3>
              <CustomerEditForm
                key={customer.id}
                customer={customer}
                onSaved={() => router.refresh()}
              />
            </section>

            <section>
              <h3 className="mb-2 text-sm font-medium">
                Orders{detail ? ` (${detail.orders.length})` : ''}
              </h3>
              {loading && (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
              {detail && detail.orders.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No orders.
                </p>
              )}
              <div className="space-y-2">
                {detail?.orders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm hover:bg-accent">
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(o.createdAt), 'd MMM yyyy')}
                    </span>
                    <OrderStatusBadge status={o.status} />
                    <span className="font-medium">
                      {formatCedis(o.total)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-medium">
                Merge duplicates
              </h3>
              <p className="mb-2 text-sm text-muted-foreground">
                If this customer also exists under another shipping mark,
                merge that record into this one. The other record&apos;s
                orders move here and it is deleted. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <select
                  value={mergedId}
                  onChange={(e) => setMergedId(e.target.value)}
                  className="h-9 flex-1 rounded-md border border-input px-2 text-sm">
                  <option value="">
                    Select a customer to merge in…
                  </option>
                  {detail?.mergeCandidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shippingMark} — {c.name ?? 'unnamed'}
                    </option>
                  ))}
                </select>
                <Button
                  variant="destructive"
                  disabled={merging || !mergedId}
                  onClick={doMerge}>
                  {merging ? 'Merging…' : 'Merge'}
                </Button>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
