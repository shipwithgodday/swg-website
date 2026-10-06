import { db } from '@/lib/db';
import { deleteOrAnonymizeCustomer } from './audience-delete';

const select = db.select as unknown as jest.Mock;
const execute = db.execute as unknown as jest.Mock;
beforeEach(() => jest.resetAllMocks());
it('deletes an orderless contact without rewinding or consuming shipping marks', async () => {
  select.mockReturnValue({ from: () => ({ where: async () => [{ n: 0 }] }) });
  const where = jest.fn().mockResolvedValue(undefined);
  const remove = jest.fn().mockReturnValue({ where });
  Object.assign(db, { delete: remove });
  await expect(deleteOrAnonymizeCustomer('customer')).resolves.toBe('deleted');
  expect(remove).toHaveBeenCalledTimes(1);
  expect(select).toHaveBeenCalledTimes(1);
  expect(execute).not.toHaveBeenCalled();
});
it('preserves order history by anonymizing a contact with orders', async () => {
  select.mockReturnValue({ from: () => ({ where: async () => [{ n: 1 }] }) });
  const set = jest.fn().mockReturnValue({ where: async () => undefined });
  (db.update as unknown as jest.Mock).mockReturnValue({ set });
  await expect(deleteOrAnonymizeCustomer('customer')).resolves.toBe('anonymized');
  expect(set).toHaveBeenCalledWith(expect.objectContaining({ name: null, email: null, source: 'deleted' }));
  expect(execute).not.toHaveBeenCalled();
});
