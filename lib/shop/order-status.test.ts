import { canTransition, nextStatuses } from './order-status';

describe('canTransition', () => {
  it('allows the forward lifecycle steps', () => {
    expect(canTransition('paid', 'processing')).toBe(true);
    expect(canTransition('processing', 'shipped')).toBe(true);
    expect(canTransition('shipped', 'delivered')).toBe(true);
  });
  it('allows jumping forward in the lifecycle', () => {
    expect(canTransition('paid', 'shipped')).toBe(true);
    expect(canTransition('paid', 'delivered')).toBe(true);
    expect(canTransition('processing', 'delivered')).toBe(true);
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
  it('forbids going backwards in the lifecycle', () => {
    expect(canTransition('shipped', 'processing')).toBe(false);
    expect(canTransition('processing', 'paid')).toBe(false);
    expect(canTransition('delivered', 'shipped')).toBe(false);
  });
  it('forbids manually advancing a pending order (webhook does that)', () => {
    expect(canTransition('pending', 'paid')).toBe(false);
    expect(canTransition('pending', 'shipped')).toBe(false);
  });
  it('forbids a no-op transition', () => {
    expect(canTransition('paid', 'paid')).toBe(false);
  });
});

describe('nextStatuses', () => {
  it('offers every forward step plus cancelled from paid', () => {
    expect(nextStatuses('paid').sort()).toEqual(
      ['cancelled', 'delivered', 'processing', 'shipped'].sort()
    );
  });
  it('offers every later step plus cancelled from processing', () => {
    expect(nextStatuses('processing').sort()).toEqual(
      ['cancelled', 'delivered', 'shipped'].sort()
    );
  });
  it('offers delivered and cancelled from shipped', () => {
    expect(nextStatuses('shipped').sort()).toEqual(
      ['cancelled', 'delivered'].sort()
    );
  });
  it('offers only cancelled from pending', () => {
    expect(nextStatuses('pending')).toEqual(['cancelled']);
  });
  it('offers nothing from delivered', () => {
    expect(nextStatuses('delivered')).toEqual([]);
  });
  it('offers nothing from cancelled', () => {
    expect(nextStatuses('cancelled')).toEqual([]);
  });
});
