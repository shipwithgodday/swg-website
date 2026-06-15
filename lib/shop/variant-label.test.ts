import { variantLabel } from './variant-label';

describe('variantLabel', () => {
  it('returns a real variant label unchanged', () => {
    expect(variantLabel('Medium / Red')).toBe('Medium / Red');
  });

  it('hides empty / whitespace labels (simple products)', () => {
    expect(variantLabel('')).toBe('');
    expect(variantLabel('   ')).toBe('');
    expect(variantLabel(null)).toBe('');
    expect(variantLabel(undefined)).toBe('');
  });

  it('hides the legacy "Default" sentinel, case-insensitively', () => {
    expect(variantLabel('Default')).toBe('');
    expect(variantLabel('default')).toBe('');
  });
});
