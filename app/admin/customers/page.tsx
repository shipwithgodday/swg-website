import { listCustomers } from '@/lib/shop/admin-customers';
import { CustomersTable } from '@/components/admin/CustomersTable';
import { NewCustomerDialog } from '@/components/admin/NewCustomerDialog';

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <NewCustomerDialog />
      </div>

      <div className="mt-6">
        <CustomersTable customers={customers} />
      </div>
    </div>
  );
}
