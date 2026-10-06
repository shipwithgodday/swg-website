jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), currentUser: jest.fn() }));
jest.mock('@/lib/shop/customer', () => ({ resolveCustomerId: jest.fn() }));
jest.mock('@/lib/email/admin-signup-email', () => ({ sendAdminSignupEmail: jest.fn() }));
import { auth, currentUser } from '@clerk/nextjs/server';
import { resolveCustomerId } from '@/lib/shop/customer';
import { sendAdminSignupEmail } from '@/lib/email/admin-signup-email';
import { completeSignup } from './complete-signup';
const authenticate = auth as unknown as jest.Mock;
const user = currentUser as unknown as jest.Mock;
const resolve = resolveCustomerId as jest.Mock;
const input = { fullName: 'Ada Example', phone: '0241234567' };
beforeEach(() => jest.resetAllMocks());
it('rejects a signed-out caller', async () => {
  authenticate.mockResolvedValue({ userId: null });
  await expect(completeSignup(input)).rejects.toThrow('Not authenticated');
  expect(resolve).not.toHaveBeenCalled();
});
it.each([null, { emailAddress: 'ada@example.com', verification: { status: 'unverified' } }])('requires a verified primary email before allocating a mark', async primaryEmailAddress => {
  authenticate.mockResolvedValue({ userId: 'user' });
  user.mockResolvedValue({ primaryEmailAddress });
  await expect(completeSignup(input)).rejects.toThrow('Verify your email');
  expect(resolve).not.toHaveBeenCalled();
  expect(sendAdminSignupEmail).not.toHaveBeenCalled();
});
it('creates a customer and notification for a verified account', async () => {
  authenticate.mockResolvedValue({ userId: 'user' });
  user.mockResolvedValue({ primaryEmailAddress: { emailAddress: 'ada@example.com', verification: { status: 'verified' } } });
  resolve.mockResolvedValue({ created: true, shippingMark: 'GD42' });
  await expect(completeSignup(input)).resolves.toEqual({ shippingMark: 'GD42' });
  expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com', clerkUserId: 'user', source: 'signup' }));
  expect(sendAdminSignupEmail).toHaveBeenCalledTimes(1);
});
