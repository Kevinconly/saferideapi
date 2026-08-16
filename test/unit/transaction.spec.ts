import { Prisma } from '@prisma/client';
import { retryTransaction } from '../../src/common/transaction';

function conflictError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    'Transaction failed due to a write conflict or a deadlock. Please retry your transaction',
    { code: 'P2034', clientVersion: 'test' },
  );
}

describe('retryTransaction', () => {
  it('retries on P2034 write conflicts and succeeds on a later attempt', async () => {
    let calls = 0;
    const result = await retryTransaction(
      async () => {
        calls += 1;
        if (calls < 3) throw conflictError();
        return 'ok';
      },
      { baseDelayMs: 1 },
    );

    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('throws the original error after exhausting attempts', async () => {
    let calls = 0;
    await expect(
      retryTransaction(
        async () => {
          calls += 1;
          throw conflictError();
        },
        { attempts: 3, baseDelayMs: 1 },
      ),
    ).rejects.toMatchObject({ code: 'P2034' });
    expect(calls).toBe(3);
  });

  it('does not retry non-conflict errors', async () => {
    let calls = 0;
    const err = new Error('boom');
    await expect(
      retryTransaction(
        async () => {
          calls += 1;
          throw err;
        },
        { attempts: 3, baseDelayMs: 1 },
      ),
    ).rejects.toBe(err);
    expect(calls).toBe(1);
  });

  it('returns the first successful result without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('first');
    await expect(retryTransaction(fn, { baseDelayMs: 1 })).resolves.toBe(
      'first',
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
