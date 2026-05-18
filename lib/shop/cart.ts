/** A line in the client-side cart. Money fields are integer pesewas. */
export interface CartItem {
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
}

/** Sum of unitPrice * quantity across all items, in pesewas. */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}
