'use client';
import { useEffect } from 'react';
import { useCart } from '@/lib/cart-context';

/**
 * Drops the contents of the client cart on mount. Mounted on the
 * post-payment confirmation page so a successful checkout doesn't
 * leave the just-purchased items sitting in the cart for next visit.
 */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
