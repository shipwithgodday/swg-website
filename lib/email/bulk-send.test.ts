import { sendBulk, normalizeRecipients } from './bulk-send';

const emails = (n: number, prefix = 'u') =>
  Array.from({ length: n }, (_, i) => `${prefix}${i}@example.com`);

describe('normalizeRecipients', () => {
  it('trims and dedupes case-insensitively', () => {
    expect(
      normalizeRecipients([' A@x.com', 'a@x.com', '', 'b@x.com'])
    ).toEqual(['A@x.com', 'b@x.com']);
  });
});

describe('sendBulk', () => {
  it('does not abort other batches when one batch throws', async () => {
    const list = emails(120);
    const calls: string[][] = [];
    const result = await sendBulk(list, async (batch) => {
      calls.push(batch);
      if (batch.includes('u60@example.com')) throw new Error('boom');
      return { Messages: batch.map(() => ({ Status: 'success' })) };
    });
    expect(calls).toHaveLength(3);
    expect(result.sent).toHaveLength(70);
    expect(result.failed).toHaveLength(50);
    expect(result.failed[0].error).toBe('boom');
  });

  it('reads per-message statuses from a Mailjet error response', async () => {
    const list = ['ok@example.com', 'bad@example.com'];
    const result = await sendBulk(list, async () => {
      const err = new Error('Unsuccessful: Status Code: "400"') as Error & {
        response: unknown;
      };
      err.response = {
        data: {
          Messages: [
            { Status: 'success' },
            { Status: 'error', Errors: [{ ErrorMessage: 'Blocked recipient' }] },
          ],
        },
      };
      throw err;
    });
    expect(result.sent).toEqual(['ok@example.com']);
    expect(result.failed).toEqual([
      { email: 'bad@example.com', error: 'Blocked recipient' },
    ]);
  });

  it('skips invalid and duplicate addresses without sending them', async () => {
    const sentTo: string[] = [];
    const result = await sendBulk(
      ['a@example.com', 'A@example.com', 'not-an-email'],
      async (batch) => {
        sentTo.push(...batch);
        return { Messages: batch.map(() => ({ Status: 'success' })) };
      }
    );
    expect(sentTo).toEqual(['a@example.com']);
    expect(result.failed).toEqual([
      { email: 'not-an-email', error: 'Invalid email address' },
    ]);
  });
});
