import { cartSubtotal, type CartItem } from './cart';

const item = (price: number, quantity: number): CartItem => ({
  variantId: crypto.randomUUID(),
  productSlug: 'p',
  productName: 'P',
  variantName: 'V',
  unitPrice: price,
  imageUrl: null,
  quantity,
});

describe('cartSubtotal', () => {
  it('sums price times quantity across items', () => {
    expect(cartSubtotal([item(5000, 2), item(1500, 1)])).toBe(11500);
  });
  it('is zero for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0);
  });
});
