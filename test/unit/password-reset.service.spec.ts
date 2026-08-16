import { describe, it, expect, jest } from '@jest/globals';
import { BadRequestException, HttpException } from '@nestjs/common';
import { PasswordResetService } from '../../src/modules/auth/password-reset.service';
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
  const env: Record<string, string> = {
    PASSWORD_RESET_TOKEN_EXPIRY_SECONDS: '900',
    PASSWORD_RESET_MAX_PER_HOUR: '5',
    PASSWORD_RESET_HASH_SALT: 'test-salt',
    PASSWORD_RESET_URL: 'https://saferide.rw/auth/reset-password',
    FRONTEND_URL: 'http://localhost:3001',
    ...overrides,
  };
  return {
    get: (k: string) => env[k],
    getNumber: (k: string) => Number(env[k]),
  } as unknown as ConfigService;
}

const userRecord = {
  id: 'user-1',
  email: 'probe@saferide.com',
  role: 'PASSENGER',
  status: 'ACTIVE',
};

function makeService(
  overrides: {
    findUnique?: jest.Mock;
    update?: jest.Mock;
    emailSend?: jest.Mock;
    revoke?: jest.Mock;
    audit?: jest.Mock;
    config?: Record<string, string>;
  } = {},
) {
  const cache = new MemoryCache();
  const redis = { getClient: () => cache } as any;
  const email = {
    send: overrides.emailSend ?? jest.fn().mockResolvedValue(undefined),
  } as any;
  const prisma = {
    user: {
      findUnique:
        overrides.findUnique ?? jest.fn().mockResolvedValue(userRecord),
      update: overrides.update ?? jest.fn().mockResolvedValue(userRecord),
    },
  } as any;
  const tokens = {
    revokeUserRefreshTokens:
      overrides.revoke ?? jest.fn().mockResolvedValue(undefined),
  } as any;
  const audit = {
    record: overrides.audit ?? jest.fn().mockResolvedValue(undefined),
  } as any;
  const config = makeConfig(overrides.config);
  const service = new PasswordResetService(
    config,
    redis,
    email,
    prisma,
    audit,
    tokens,
  );
  return { service, cache, email, prisma, tokens, audit };
}

describe('PasswordResetService.requestPasswordReset', () => {
  it('stores a hashed token and emails a reset link for a known email', async () => {
    const { service, cache, email } = makeService();

    const res = await service.requestPasswordReset({
      email: 'Probe@Saferide.com',
      ip: null,
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('reset link has been sent');

    const sent = email.send.mock.calls[0][0] as {
      to: string;
      text: string;
      html: string;
    };
    expect(sent.to).toBe('probe@saferide.com');
    const token = /token=([A-Za-z0-9_-]+)/.exec(sent.html)![1];
    expect(token.length).toBeGreaterThan(40);

    // Stored record must not contain the plaintext token.
    const raw = await cache.get(`auth:pwd_reset:${token}`);
    expect(raw).toBeNull();
    const entries = Array.from((cache as any).store.keys()).filter(
      (k: string) => k.startsWith('auth:pwd_reset:token:'),
    );
    expect(entries).toHaveLength(1);
    const record = JSON.parse((await cache.get(entries[0]))!);
    expect(record.email).toBe('probe@saferide.com');
  });

  it('does not send an email or store a token for an unknown email', async () => {
    const { service, email } = makeService({
      findUnique: jest.fn().mockResolvedValue(null),
    });

    const res = await service.requestPasswordReset({
      email: 'nobody@example.com',
      ip: null,
    });

    expect(res.success).toBe(true);
    expect(email.send).not.toHaveBeenCalled();
  });

  it('responds identically for suspended accounts (no enumeration)', async () => {
    const { service, email } = makeService({
      findUnique: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'x@example.com',
        status: 'SUSPENDED',
      }),
    });

    const res = await service.requestPasswordReset({
      email: 'x@example.com',
      ip: null,
    });

    expect(res.success).toBe(true);
    expect(email.send).not.toHaveBeenCalled();
  });

  it('deletes the pending token when email delivery fails', async () => {
    const { service, cache, email } = makeService({
      emailSend: jest.fn().mockRejectedValue(new Error('smtp down')),
    });

    await expect(
      service.requestPasswordReset({ email: 'probe@saferide.com', ip: null }),
    ).rejects.toThrow('Email service is temporarily unavailable');

    const entries = Array.from((cache as any).store.keys()).filter(
      (k: string) => k.startsWith('auth:pwd_reset:token:'),
    );
    expect(entries).toHaveLength(0);
    expect(email.send).toHaveBeenCalledTimes(1);
  });

  it('rate-limits repeated requests for the same email', async () => {
    const { service } = makeService({
      config: { PASSWORD_RESET_MAX_PER_HOUR: '1' },
    });

    await service.requestPasswordReset({
      email: 'probe@saferide.com',
      ip: null,
    });
    await expect(
      service.requestPasswordReset({ email: 'probe@saferide.com', ip: null }),
    ).rejects.toBeInstanceOf(HttpException);
  });
});

describe('PasswordResetService.resetPassword', () => {
  async function issueToken(service: PasswordResetService, email: string) {
    await service.requestPasswordReset({ email, ip: null });
    const sent = (service as any).email.send.mock.calls[0][0] as {
      html: string;
    };
    return /token=([A-Za-z0-9_-]+)/.exec(sent.html)![1];
  }

  it('resets the password, invalidates sessions, and audits', async () => {
    const { service, prisma, tokens, audit, cache } = makeService();
    const token = await issueToken(service, 'probe@saferide.com');

    await expect(
      service.resetPassword({ token, password: 'newSecret123', ip: null }),
    ).resolves.toEqual({ success: true });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          passwordHash: expect.stringContaining(':'),
          tokenVersion: { increment: 1 },
        }),
      }),
    );
    expect(tokens.revokeUserRefreshTokens).toHaveBeenCalledWith('user-1');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.password_reset' }),
    );

    // Token is single-use.
    await expect(
      service.resetPassword({ token, password: 'anotherPass123', ip: null }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const entries = Array.from((cache as any).store.keys()).filter(
      (k: string) => k.startsWith('auth:pwd_reset:token:'),
    );
    expect(entries).toHaveLength(0);
  });

  it('rejects an unknown token', async () => {
    const { service } = makeService();

    await expect(
      service.resetPassword({
        token: 'totally-made-up-token',
        password: 'newSecret123',
        ip: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired token and consumes it', async () => {
    const { service, cache } = makeService();
    const token = await issueToken(service, 'probe@saferide.com');

    const key = Array.from((cache as any).store.keys()).find((k: string) =>
      k.startsWith('auth:pwd_reset:token:'),
    )!;
    const record = JSON.parse((await cache.get(key))!);
    record.expiresAt = Date.now() - 1000;
    await cache.set(key, JSON.stringify(record), 'EX', 1);

    await expect(
      service.resetPassword({ token, password: 'newSecret123', ip: null }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(cache.get(key)).resolves.toBeNull();
  });

  it('rejects a reset whose user was deleted since issuance', async () => {
    const { service } = makeService({
      findUnique: jest
        .fn()
        .mockResolvedValueOnce(userRecord)
        .mockResolvedValueOnce(null),
    });
    const token = await issueToken(service, 'probe@saferide.com');

    await expect(
      service.resetPassword({ token, password: 'newSecret123', ip: null }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a reset for a suspended account', async () => {
    const { service } = makeService({
      findUnique: jest
        .fn()
        .mockResolvedValueOnce(userRecord)
        .mockResolvedValue({ ...userRecord, status: 'SUSPENDED' }),
    });
    const token = await issueToken(service, 'probe@saferide.com');

    await expect(
      service.resetPassword({ token, password: 'newSecret123', ip: null }),
    ).rejects.toThrow('Account is suspended');
  });
});
