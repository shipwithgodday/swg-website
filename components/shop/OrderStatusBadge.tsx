import { Badge } from '@/components/ui/badge';

const LABELS: Record<string, string> = {
  pending: 'Pending payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function OrderStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'cancelled'
      ? 'destructive'
      : status === 'pending'
        ? 'secondary'
        : 'default';
  return <Badge variant={tone}>{LABELS[status] ?? status}</Badge>;
}
