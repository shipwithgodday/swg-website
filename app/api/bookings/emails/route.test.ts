jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { GET } from './route';
const authenticate = auth as unknown as jest.Mock;
const select = db.select as unknown as jest.Mock;
beforeEach(() => jest.resetAllMocks());
it('rejects unauthenticated audience reads without querying contacts', async () => {
  authenticate.mockResolvedValue({ userId: null, sessionClaims: null });
  expect((await GET()).status).toBe(401);
  expect(select).not.toHaveBeenCalled();
});
it('rejects non-admin audience reads without querying contacts', async () => {
  authenticate.mockResolvedValue({ userId: 'user', sessionClaims: { metadata: { role: 'customer' } } });
  expect((await GET()).status).toBe(403);
  expect(select).not.toHaveBeenCalled();
});
it('allows admins to read the audience', async () => {
  authenticate.mockResolvedValue({ userId: 'admin', sessionClaims: { metadata: { role: 'admin' } } });
  select.mockReturnValue({ from: () => Object.assign(Promise.resolve([]), { where: async () => [] }) });
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ emails: [] });
});
