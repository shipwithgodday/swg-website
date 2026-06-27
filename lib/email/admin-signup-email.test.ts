import { buildAdminSignupEmail } from './admin-signup-email';

const base = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '0241234567',
  company: 'Analytical Engines',
  shippingMark: 'GD42',
  createdAt: new Date('2026-06-27T10:00:00Z'),
};

describe('buildAdminSignupEmail', () => {
  it('returns null when no recipient is configured', () => {
    expect(buildAdminSignupEmail({ ...base, to: undefined })).toBeNull();
  });
  it('addresses the configured admin and names the mark in the subject', () => {
    const msg = buildAdminSignupEmail({ ...base, to: 'admin@swg.com' });
    expect(msg).not.toBeNull();
    expect(msg!.to).toBe('admin@swg.com');
    expect(msg!.subject).toContain('GD42');
    expect(msg!.subject).toContain('Ada Lovelace');
  });
  it('includes all user details in the body', () => {
    const msg = buildAdminSignupEmail({ ...base, to: 'admin@swg.com' })!;
    expect(msg.html).toContain('ada@example.com');
    expect(msg.html).toContain('0241234567');
    expect(msg.html).toContain('Analytical Engines');
    expect(msg.html).toContain('GD42');
  });
  it('shows a dash when company is missing', () => {
    const msg = buildAdminSignupEmail({
      ...base,
      company: null,
      to: 'admin@swg.com',
    })!;
    expect(msg.html).toContain('—');
  });
});
