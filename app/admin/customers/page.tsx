import { listCustomers } from '@/lib/shop/admin-customers';
import { CustomersTable } from '@/components/admin/CustomersTable';
import { NewCustomerDialog } from '@/components/admin/NewCustomerDialog';
import { MotionReveal } from '@/components/shared/MotionReveal';

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <MotionReveal className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <NewCustomerDialog />
      </MotionReveal>

      <MotionReveal delay={0.05} className="mt-6">
        <CustomersTable customers={customers} />
      </MotionReveal>
    </div>
  );
}
