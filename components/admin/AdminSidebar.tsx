'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderTree,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const NAV = [
  {
    section: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    ],
  },
  {
    section: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    section: 'Settings',
    items: [
      {
        href: '/admin/settings/delivery-zones',
        label: 'Delivery zones',
        icon: Truck,
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-zinc-950 text-zinc-400">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-zinc-950">
          <span className="text-sm font-bold">G</span>
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Godday</p>
          <p className="text-xs text-zinc-500">Shop admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-600 uppercase">
              {group.section}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-zinc-950'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    )}>
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-900 px-5 py-4">
        <p className="text-xs text-zinc-600">Lucky Godday Business Services</p>
      </div>
    </aside>
  );
}
