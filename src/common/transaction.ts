import { Prisma } from '@prisma/client';

export interface RetryOptions {
  /** Total attempts including the first try. Default 4. */
  attempts?: number;
  /** Base delay in ms; each retry multiplies it by 2. Default 50. */
  baseDelayMs?: number;
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034: transaction failed due to a write conflict or a deadlock.
    return err.code === 'P2034';
  }
  return false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs an interactive Prisma transaction that mutates a shared aggregate (e.g.
 * a ride) and transparently retries when MongoDB aborts it with a write
 * conflict or deadlock (P2034). Write conflicts are expected under concurrency
 * (e.g. two dispatch rounds racing to reserve the same ride), so callers must
 * keep the transaction body idempotent — use guarded updates, not blind ones.
 */
export async function retryTransaction<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 50;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || i === attempts - 1) throw err;
      await sleep(baseDelayMs * 2 ** i + Math.random() * 20);
    }
  }
  throw lastError;
}
