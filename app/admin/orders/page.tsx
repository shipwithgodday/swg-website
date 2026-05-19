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
