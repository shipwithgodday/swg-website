import { generateOrderNumber, isValidOrderNumber } from './order-number';

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

describe('isValidOrderNumber', () => {
  it('accepts a freshly generated order number', () => {
    expect(isValidOrderNumber(generateOrderNumber())).toBe(true);
  });
  it('accepts a known-good value and is case/space tolerant', () => {
    expect(isValidOrderNumber('SWG-7K2P9QXM')).toBe(true);
    expect(isValidOrderNumber('  swg-7k2p9qxm  ')).toBe(true);
  });
  it('rejects wrong prefix, wrong length, and ambiguous chars', () => {
    expect(isValidOrderNumber('XYZ-7K2P9QXM')).toBe(false); // bad prefix
    expect(isValidOrderNumber('SWG-7K2P9QX')).toBe(false); // 7 chars
    expect(isValidOrderNumber('SWG-7K2P9QXMZ')).toBe(false); // 9 chars
    expect(isValidOrderNumber('SWG-7K2P9QI0')).toBe(false); // I and 0 not in alphabet
    expect(isValidOrderNumber('')).toBe(false);
  });
});
