'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderTree,
  LayoutDashboard,
  Mail,
  Menu,
  Package,
  Ship,
  ShoppingCart,
  Truck,
  Users,
  X,
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
    section: 'Logistics',
    items: [
      { href: '/admin/shipments', label: 'Shipments', icon: Ship },
    ],
  },
  {
    section: 'Marketing',
    items: [{ href: '/admin/emails', label: 'Emails', icon: Mail }],
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
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
                    onClick={onNavigate}
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
    </>
  );
}

/**
 * Responsive admin sidebar.
 *
 * - `md` and up: fixed left rail (sticky, w-60).
 * - Below `md`: a top bar with a hamburger that opens a slide-in drawer.
 *
 * The drawer is implemented inline (no Sheet primitive) so the dark
 * branding and per-link active state remain identical to the desktop
 * rail without re-styling.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Auto-close the drawer whenever the user navigates.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-900 bg-zinc-950 px-4 text-zinc-200 md:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-zinc-950">
            <span className="text-xs font-bold">G</span>
          </span>
          <span className="text-sm font-semibold text-white">Godday</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="grid size-9 place-items-center rounded-lg text-zinc-300 hover:bg-zinc-900 hover:text-white">
          <Menu className="size-5" />
        </button>
      </header>

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-zinc-950 text-zinc-400 md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[1px] animate-in fade-in-0"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-zinc-950 text-zinc-400 shadow-xl animate-in slide-in-from-left duration-200">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 grid size-9 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white">
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
