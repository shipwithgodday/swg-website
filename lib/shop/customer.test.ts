import { normalizePhone } from './customer';

describe('normalizePhone', () => {
  it('strips non-digits and keeps the last 9 digits', () => {
    expect(normalizePhone('024 123 4567')).toBe('241234567');
  });
  it('treats +233, 0-prefixed, and bare forms as equal', () => {
    expect(normalizePhone('+233 24 123 4567')).toBe('241234567');
    expect(normalizePhone('0241234567')).toBe('241234567');
    expect(normalizePhone('241234567')).toBe('241234567');
  });
  it('returns empty string when there are no digits', () => {
    expect(normalizePhone('WeChat')).toBe('');
  });
});
