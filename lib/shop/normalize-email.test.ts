import { normalizeEmail } from './normalize-email';

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Joe@Example.COM ')).toBe('joe@example.com');
  });
  it('treats null/undefined/blank as empty', () => {
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
    expect(normalizeEmail('   ')).toBe('');
  });
  it('leaves an already-canonical address unchanged', () => {
    expect(normalizeEmail('joe@example.com')).toBe('joe@example.com');
  });
});
