import {
  categoryInputSchema,
  productInputSchema,
  productOptionsSchema,
  customerEditSchema,
} from './validation';

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
    isPreorder: false,
    preorderShipEstimate: null,
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
  it('accepts a preorder product with a ship estimate', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        isPreorder: true,
        preorderShipEstimate: 'Ships in ~2 weeks',
      }).success
    ).toBe(true);
  });
  it('accepts a preorder product without a ship estimate', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        isPreorder: true,
        preorderShipEstimate: null,
      }).success
    ).toBe(true);
  });
  it('rejects a ship estimate longer than 120 characters', () => {
    expect(
      productInputSchema.safeParse({
        ...base,
        isPreorder: true,
        preorderShipEstimate: 'x'.repeat(121),
      }).success
    ).toBe(false);
  });
});

describe('productOptionsSchema', () => {
  it('accepts up to two options', () => {
    expect(
      productOptionsSchema.safeParse([
        { name: 'Size', values: ['S', 'M', 'L'] },
        { name: 'Color', values: ['Red'] },
      ]).success
    ).toBe(true);
  });
  it('accepts an empty list', () => {
    expect(productOptionsSchema.safeParse([]).success).toBe(true);
  });
  it('rejects more than two options', () => {
    expect(
      productOptionsSchema.safeParse([
        { name: 'A', values: ['1'] },
        { name: 'B', values: ['1'] },
        { name: 'C', values: ['1'] },
      ]).success
    ).toBe(false);
  });
  it('rejects an option with no values', () => {
    expect(
      productOptionsSchema.safeParse([{ name: 'Size', values: [] }]).success
    ).toBe(false);
  });
});

describe('customerEditSchema', () => {
  it('accepts valid edits', () => {
    expect(
      customerEditSchema.safeParse({
        name: 'Ama',
        email: 'ama@example.com',
        phone: '0241234567',
      }).success
    ).toBe(true);
  });
  it('accepts null fields', () => {
    expect(
      customerEditSchema.safeParse({
        name: null,
        email: null,
        phone: null,
      }).success
    ).toBe(true);
  });
  it('rejects a malformed email', () => {
    expect(
      customerEditSchema.safeParse({ email: 'not-an-email' }).success
    ).toBe(false);
  });
});
