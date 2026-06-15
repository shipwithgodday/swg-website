import { formatCedis } from './money';

describe('formatCedis', () => {
  it('formats pesewas as a cedi string', () => {
    expect(formatCedis(500000)).toBe('GHS 5,000.00');
  });
  it('formats zero', () => {
    expect(formatCedis(0)).toBe('GHS 0.00');
  });
  it('formats sub-cedi amounts', () => {
    expect(formatCedis(50)).toBe('GHS 0.50');
  });
});
