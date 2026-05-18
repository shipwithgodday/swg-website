import { categoryInputSchema, productInputSchema } from './validation';

describe('categoryInputSchema', () => {
  it('accepts a valid category', () => {
    const r = categoryInputSchema.safeParse({
      name: 'Bags',
      description: 'Travel bags',
      imageUrl: null,
    });
    expect(r.success).toBe(true);
  });
  it('rejects an empty name', () => {
    const r = categoryInputSchema.safeParse({ name: '' });
    expect(r.success).toBe(false);
  });
});

describe('productInputSchema', () => {
  const base = {
    name: 'Travel Bag',
    description: 'A bag',
    categoryId: null,
    status: 'draft' as const,
    featured: false,
    variants: [
      { name: 'Default', sku: null, price: 5000, stockQuantity: 10 },
    ],
  };
  it('accepts a valid product', () => {
    expect(productInputSchema.safeParse(base).success).toBe(true);
  });
  it('requires at least one variant', () => {
    expect(
      productInputSchema.safeParse({ ...base, variants: [] }).success
    ).toBe(false);
  });
  it('rejects a negative price', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        variants: [{ name: 'X', sku: null, price: -1, stockQuantity: 0 }],
      }).success
    ).toBe(false);
  });
  it('rejects an invalid status', () => {
    expect(
      productInputSchema.safeParse({ ...base, status: 'live' }).success
    ).toBe(false);
  });
});
