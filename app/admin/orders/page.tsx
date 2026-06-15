import { listOrders } from '@/lib/shop/admin-orders';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { MotionReveal } from '@/components/shared/MotionReveal';

export default async function AdminOrdersPage() {
  const rows = await listOrders({});

  return (
    <div className="space-y-6">
      <MotionReveal>
        <AdminPageHeader
          title="Orders"
          description="Every order placed in the shop."
        />
      </MotionReveal>
      <MotionReveal delay={0.05}>
        <OrdersTable orders={rows} />
      </MotionReveal>
    </div>
  );
}
