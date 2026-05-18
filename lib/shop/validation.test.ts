import { categoryInputSchema } from './validation';

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
