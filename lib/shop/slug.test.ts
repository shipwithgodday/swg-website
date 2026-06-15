import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Blue Travel Bag')).toBe('blue-travel-bag');
  });
  it('strips punctuation', () => {
    expect(slugify('Men’s Shoes (New!)')).toBe('mens-shoes-new');
  });
  it('collapses repeated separators', () => {
    expect(slugify('  multiple   spaces  ')).toBe('multiple-spaces');
  });
  it('handles empty input', () => {
    expect(slugify('')).toBe('');
  });
});
