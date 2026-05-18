import crypto from 'crypto';
import { verifyPaystackSignature } from './paystack';

describe('verifyPaystackSignature', () => {
  const secret = 'sk_test_example';
  const body = JSON.stringify({ event: 'charge.success' });
  const valid = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');

  it('accepts a correct signature', () => {
    expect(verifyPaystackSignature(body, valid, secret)).toBe(true);
  });
  it('rejects a tampered signature', () => {
    expect(verifyPaystackSignature(body, valid, secret)).toBe(true);
    expect(
      verifyPaystackSignature(body + 'x', valid, secret)
    ).toBe(false);
  });
  it('rejects an empty signature', () => {
    expect(verifyPaystackSignature(body, '', secret)).toBe(false);
  });
});
