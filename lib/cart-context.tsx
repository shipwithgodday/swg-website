'use client';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { cartSubtotal, type CartItem } from '@/lib/shop/cart';

const STORAGE_KEY = 'swg-shop-cart';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  subtotal: 0,
  addItem: () => {},
  removeItem: () => {},
  setQuantity: () => {},
  clear: () => {},
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartItem>[];
        const valid: CartItem[] = parsed.flatMap((p) => {
          if (
            typeof p.variantId !== 'string' ||
            typeof p.productSlug !== 'string' ||
            typeof p.productName !== 'string' ||
            typeof p.variantName !== 'string' ||
            typeof p.unitPrice !== 'number' ||
            typeof p.quantity !== 'number'
          ) {
            return [];
          }
          return [
            {
              variantId: p.variantId,
              productSlug: p.productSlug,
              productName: p.productName,
              variantName: p.variantName,
              unitPrice: p.unitPrice,
              imageUrl: p.imageUrl ?? null,
              quantity: p.quantity,
              isPreorder: p.isPreorder ?? false,
              preorderShipEstimate: p.preorderShipEstimate ?? null,
            },
          ];
        });
        setItems(valid);
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist whenever items change (after hydration).
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          return prev.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { ...item, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.reduce((n, i) => n + i.quantity, 0),
        subtotal: cartSubtotal(items),
        addItem,
        removeItem,
        setQuantity,
        clear,
      }}>
      {children}
    </CartContext.Provider>
  );
};
