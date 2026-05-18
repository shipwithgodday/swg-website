'use client';
import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/lib/cart-context';
import { CartView } from './CartView';

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative inline-flex items-center">
        <ShoppingBag className="size-5" />
        {itemCount > 0 && (
          <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-black">
            {itemCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="w-full max-w-sm overflow-y-auto p-6">
        <SheetHeader className="px-0">
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <CartView onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
