import {
  titleCase,
  formatOrderStatus,
  formatProductStatus,
} from './status-format';

describe('titleCase', () => {
  it('capitalises each word', () => {
    expect(titleCase('hello world')).toBe('Hello World');
  });
  it('splits on underscores and hyphens', () => {
    expect(titleCase('in_transit-now')).toBe('In Transit Now');
  });
  it('lowercases the rest of each word', () => {
    expect(titleCase('SHIPPED')).toBe('Shipped');
  });
  it('returns empty string unchanged', () => {
    expect(titleCase('')).toBe('');
  });
});

describe('formatOrderStatus', () => {
  it('maps known order statuses to friendly labels', () => {
    expect(formatOrderStatus('pending')).toBe('Pending Payment');
    expect(formatOrderStatus('paid')).toBe('Paid');
    expect(formatOrderStatus('processing')).toBe('Processing');
    expect(formatOrderStatus('procured_china')).toBe(
      'Procured to China Warehouse'
    );
    expect(formatOrderStatus('shipped')).toBe('Shipped');
    expect(formatOrderStatus('arrived_ghana')).toBe(
      'Available at Ghana Warehouse'
    );
    expect(formatOrderStatus('delivered')).toBe('Delivered');
    expect(formatOrderStatus('cancelled')).toBe('Cancelled');
  });
  it('falls back to titleCase for unknown statuses', () => {
    expect(formatOrderStatus('on_hold')).toBe('On Hold');
  });
});

describe('formatProductStatus', () => {
  it('capitalises product statuses', () => {
    expect(formatProductStatus('draft')).toBe('Draft');
    expect(formatProductStatus('active')).toBe('Active');
    expect(formatProductStatus('archived')).toBe('Archived');
  });
});
