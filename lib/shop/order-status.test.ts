import { canTransition, nextStatuses } from './order-status';

describe('canTransition', () => {
  it('allows the forward lifecycle steps', () => {
    expect(canTransition('paid', 'processing')).toBe(true);
    expect(canTransition('processing', 'shipped')).toBe(true);
    expect(canTransition('shipped', 'delivered')).toBe(true);
  });
  it('allows cancelling any pre-delivered order', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
    expect(canTransition('paid', 'cancelled')).toBe(true);
    expect(canTransition('shipped', 'cancelled')).toBe(true);
  });
  it('forbids cancelling or changing a delivered order', () => {
    expect(canTransition('delivered', 'cancelled')).toBe(false);
    expect(canTransition('delivered', 'shipped')).toBe(false);
  });
  it('forbids skipping steps and going backwards', () => {
    expect(canTransition('paid', 'shipped')).toBe(false);
    expect(canTransition('shipped', 'processing')).toBe(false);
  });
  it('forbids manually advancing a pending order (webhook does that)', () => {
    expect(canTransition('pending', 'paid')).toBe(false);
  });
  it('forbids a no-op transition', () => {
    expect(canTransition('paid', 'paid')).toBe(false);
  });
});

describe('nextStatuses', () => {
  it('offers processing and cancelled from paid', () => {
    expect(nextStatuses('paid').sort()).toEqual(
      ['cancelled', 'processing'].sort()
    );
  });
  it('offers nothing from delivered', () => {
    expect(nextStatuses('delivered')).toEqual([]);
  });
});
