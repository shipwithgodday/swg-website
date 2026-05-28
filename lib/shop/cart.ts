/** A line in the client-side cart. Money fields are integer pesewas. */
export interface CartItem {
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  /**
   * Preorder snapshot for client-side rendering only. The authoritative
   * snapshot persisted on `order_items` is taken server-side from the
   * `products` table at order-creation time.
   */
  isPreorder: boolean;
  preorderShipEstimate: string | null;
}

/** Sum of unitPrice * quantity across all items, in pesewas. */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
