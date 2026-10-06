jest.mock('botid/server', () => ({ checkBotId: jest.fn() }));
import { checkBotId } from 'botid/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { POST } from './route';

const check = checkBotId as jest.Mock;
const select = db.select as unknown as jest.Mock;
const insert = db.insert as unknown as jest.Mock;
const payload = { fullName: 'Ada Example', email: 'ADA@example.com', phoneNumber: '0241234567' };
const request = () => new Request('https://www.shipwithgodday.com/api/customers/subscribe', {
  method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' },
});
beforeEach(() => jest.resetAllMocks());
it('rejects bots without reading or writing contacts', async () => {
  check.mockResolvedValue({ isBot: true });
  expect((await POST(request())).status).toBe(403);
  expect(select).not.toHaveBeenCalled();
  expect(insert).not.toHaveBeenCalled();
});
it('fails closed when bot verification is unavailable', async () => {
  check.mockRejectedValue(new Error('unavailable'));
  expect((await POST(request())).status).toBe(503);
  expect(select).not.toHaveBeenCalled();
  expect(insert).not.toHaveBeenCalled();
});
it('accepts a human subscription without creating a customer or shipping mark', async () => {
  check.mockResolvedValue({ isBot: false });
  select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [] }) }) });
  const values = jest.fn().mockReturnValue({ returning: async () => [{ id: 'subscriber', fullName: payload.fullName, email: 'ada@example.com' }] });
  insert.mockReturnValue({ values });
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(insert).toHaveBeenCalledTimes(1);
  expect(insert).toHaveBeenCalledWith(subscribers);
  expect(values).toHaveBeenCalledWith({ ...payload, email: 'ada@example.com' });
  expect(await response.json()).not.toHaveProperty('shippingMark');
  expect(db.execute).not.toHaveBeenCalled();
});
