import { hasAdminRole } from './auth';

describe('hasAdminRole', () => {
  it('is true when metadata.role is admin', () => {
    expect(hasAdminRole({ metadata: { role: 'admin' } })).toBe(true);
  });
  it('is false for a non-admin role', () => {
    expect(hasAdminRole({ metadata: { role: 'customer' } })).toBe(false);
  });
  it('is false when claims are null', () => {
    expect(hasAdminRole(null)).toBe(false);
  });
  it('is false when metadata is missing', () => {
    expect(hasAdminRole({})).toBe(false);
  });
});
