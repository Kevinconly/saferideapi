import { describe, it, expect, jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';
import {
  EmailOtpService,
  normalizeEmail,
} from '../../src/modules/auth/email-otp.service';
import { ConfigService } from '../../src/config/config.service';

type SetValue = string | number;

class MemoryCache {
  private store = new Map<
    string,
    { value: SetValue; expiresAt: number | null }
  >();

  private prune(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async get(key: string): Promise<string | null> {
    if (!this.prune(key)) return null;
    return String(this.store.get(key)!.value);
  }

  async set(
    key: string,
    value: SetValue,
    _mode?: string,
    ttlSeconds?: number,
  ): Promise<'OK'> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.store.delete(key)) removed += 1;
    }
    return removed;
  }

  async incr(key: string): Promise<number> {
    const current = this.prune(key) ? Number(this.store.get(key)!.value) : 0;
    const next = current + 1;
    this.store.set(key, { value: next, expiresAt: null });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }
}

function makeConfig(overrides: Record<string, string> = {}) {
  const env = {
    EMAIL_OTP_EXPIRY_SECONDS: '300',
    EMAIL_OTP_MAX_PER_60S: '1',
    EMAIL_OTP_MAX_PER_HOUR: '5',
    EMAIL_OTP_MAX_FAILED_ATTEMPTS: '5',
    EMAIL_OTP_HASH_SALT: 'test-salt',
    EMAIL_MOCK: 'true',
    EMAIL_PROVIDER: 'mock',
    ...overrides,
  };
  return {
    get: (k: string) => env[k],
    getNumber: (k: string) => Number(env[k]),
  } as unknown as ConfigService;
}

function makeService(overrides: Record<string, string> = {}) {
  const cache = new MemoryCache();
  const redis = { getClient: () => cache } as any;
  const email = { send: jest.fn().mockResolvedValue(undefined) } as any;
  const config = makeConfig(overrides);
  const service = new EmailOtpService(config, redis, email);
  return { service, cache, email, config };
}

describe('EmailOtpService', () => {
  describe('normalizeEmail', () => {
    it('trims and lowercases', () => {
      expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
    });
  });

  describe('request + verify happy path', () => {
    it('stores a hashed code and verifies the matching code', async () => {
      const { service, cache } = makeService();
      await service.request('user@example.com', null);

      const raw = await cache.get('auth:email_otp:user@example.com');
      expect(raw).toBeTruthy();
      const record = JSON.parse(raw!);
      expect(record.hash).not.toContain('000000');
      expect(record.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(record.attempts).toBe(0);

      // Extract the plaintext code from the mock email payload and verify it.
      const sent = (service as any).email.send.mock.calls[0][0] as {
        text: string;
      };
      const code = /code is (\d{6})/.exec(sent.text)![1];

      await expect(service.verify('user@example.com', code)).resolves.toBe(
        true,
      );
      await expect(
        cache.get('auth:email_otp:user@example.com'),
      ).resolves.toBeNull();
    });

    it('deletes the code on successful verification', async () => {
      const { service, cache } = makeService();
      await service.request('a@b.com', null);
      const sent = (service as any).email.send.mock.calls[0][0] as {
        text: string;
      };
      const code = /code is (\d{6})/.exec(sent.text)![1];
      await service.verify('a@b.com', code);
      await expect(cache.get('auth:email_otp:a@b.com')).resolves.toBeNull();
    });
  });

  describe('wrong code handling', () => {
    it('increments attempts on a wrong code and rejects', async () => {
      const { service, cache } = makeService({
        EMAIL_OTP_MAX_FAILED_ATTEMPTS: '5',
      });
      await service.request('u@x.com', null);

      for (let i = 1; i <= 4; i += 1) {
        await expect(service.verify('u@x.com', '000000')).resolves.toBe(false);
        const record = JSON.parse((await cache.get('auth:email_otp:u@x.com'))!);
        expect(record.attempts).toBe(i);
      }
    });

    it('deletes the key after the max failed attempts', async () => {
      const { service, cache } = makeService({
        EMAIL_OTP_MAX_FAILED_ATTEMPTS: '5',
      });
      await service.request('u@x.com', null);

      for (let i = 0; i < 5; i += 1) {
        await service.verify('u@x.com', '000000');
      }
      await expect(cache.get('auth:email_otp:u@x.com')).resolves.toBeNull();
      // Further verification impossible (no code present).
      await expect(service.verify('u@x.com', '000000')).resolves.toBe(false);
    });
  });

  describe('re-issuance invalidation', () => {
    it('invalidates the previous code when a new one is requested', async () => {
      const { service } = makeService({ EMAIL_OTP_MAX_PER_60S: '10' });
      await service.request('u@x.com', null);
      const firstSent = (service as any).email.send.mock.calls[0][0] as {
        text: string;
      };
      const firstCode = /code is (\d{6})/.exec(firstSent.text)![1];

      await service.request('u@x.com', null);
      const secondSent = (service as any).email.send.mock.calls[1][0] as {
        text: string;
      };
      const secondCode = /code is (\d{6})/.exec(secondSent.text)![1];
      expect(secondCode).not.toBe(firstCode);

      await expect(service.verify('u@x.com', firstCode)).resolves.toBe(false);
      await expect(service.verify('u@x.com', secondCode)).resolves.toBe(true);
    });
  });

  describe('email normalization in storage', () => {
    it('maps differently-cased emails to the same key', async () => {
      const { service, cache } = makeService();
      await service.request('  User@Example.COM ', null);

      const raw = await cache.get('auth:email_otp:user@example.com');
      expect(raw).toBeTruthy();
      await expect(
        cache.get('auth:email_otp:  User@Example.COM '),
      ).resolves.toBeNull();
    });
  });

  describe('rate limiting', () => {
    it('blocks a second request within 60s for the same email', async () => {
      const { service } = makeService();
      await service.request('u@x.com', null);
      await expect(service.request('u@x.com', null)).rejects.toBeInstanceOf(
        HttpException,
      );
    });

    it('allows requests for different emails', async () => {
      const { service } = makeService();
      await service.request('a@x.com', null);
      await expect(service.request('b@x.com', null)).resolves.toBeUndefined();
    });
  });

  describe('expiry', () => {
    it('rejects an expired code and deletes the record', async () => {
      const { service, cache } = makeService({
        EMAIL_OTP_EXPIRY_SECONDS: '1',
      });
      await service.request('u@x.com', null);
      const sent = (service as any).email.send.mock.calls[0][0] as {
        text: string;
      };
      const code = /code is (\d{6})/.exec(sent.text)![1];

      // Force expiry by rewriting expiresAt into the past.
      const raw = await cache.get('auth:email_otp:u@x.com');
      const record = JSON.parse(raw!);
      record.expiresAt = Date.now() - 1000;
      await cache.set(
        'auth:email_otp:u@x.com',
        JSON.stringify(record),
        'EX',
        1,
      );

      await expect(service.verify('u@x.com', code)).resolves.toBe(false);
      await expect(cache.get('auth:email_otp:u@x.com')).resolves.toBeNull();
    });
  });
});
