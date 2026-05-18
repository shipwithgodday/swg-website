import { generateOrderNumber } from './order-number';

describe('generateOrderNumber', () => {
  it('starts with the SWG- prefix', () => {
    expect(generateOrderNumber()).toMatch(/^SWG-[A-Z0-9]{8}$/);
  });
  it('produces unique values', () => {
    const seen = new Set(
      Array.from({ length: 500 }, () => generateOrderNumber())
    );
    expect(seen.size).toBe(500);
  });
});
