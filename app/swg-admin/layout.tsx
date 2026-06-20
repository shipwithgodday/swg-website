import { requireAdmin } from '@/lib/shop/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f7] md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
