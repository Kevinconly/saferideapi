import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PasswordResetService } from '../../src/modules/auth/password-reset.service';
import { EmailOtpService } from '../../src/modules/auth/email-otp.service';
import { EmailService } from '../../src/modules/email/email.service';
import { ConfigService } from '../../src/config/config.service';
import { TokenService } from '../../src/modules/auth/token.service';
import { AuditService } from '../../src/modules/audit/audit.service';
import { OtpService } from '../../src/modules/auth/otp.service';
import { RedisService } from '../../src/common/redis.service';
import { PrismaService } from '../../src/prisma/prisma.service';

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

const testConfig = {
  EMAIL_OTP_EXPIRY_SECONDS: '300',
  EMAIL_OTP_MAX_PER_60S: '1',
  EMAIL_OTP_MAX_PER_HOUR: '5',
  EMAIL_OTP_MAX_FAILED_ATTEMPTS: '5',
  EMAIL_OTP_HASH_SALT: 'test-salt',
  EMAIL_MOCK: 'true',
  EMAIL_PROVIDER: 'mock',
  EMAIL_FROM: 'SafeRide <no-reply@saferide.rw>',
  RESEND_API_KEY: '',
  PASSWORD_RESET_TOKEN_EXPIRY_SECONDS: '900',
  PASSWORD_RESET_MAX_PER_HOUR: '5',
  PASSWORD_RESET_HASH_SALT: 'test-salt',
  PASSWORD_RESET_URL: 'https://saferide.rw/auth/reset-password',
  FRONTEND_URL: 'http://localhost:3001',
};

describe('Password reset (integration)', () => {
  let app: INestApplication<App>;
  let prismaFindUnique: jest.Mock;
  let prismaUpdate: jest.Mock;
  let emailSend: jest.Mock;
  let revokeTokens: jest.Mock;

  beforeEach(async () => {
    prismaFindUnique = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'probe@saferide.com',
      role: 'PASSENGER',
      status: 'ACTIVE',
    });
    prismaUpdate = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'probe@saferide.com',
      role: 'PASSENGER',
      status: 'ACTIVE',
      tokenVersion: 2,
    });
    emailSend = jest.fn().mockResolvedValue(undefined);
    revokeTokens = jest.fn().mockResolvedValue(undefined);

    const config = {
      get: (k: string) => (testConfig as Record<string, string>)[k],
      getNumber: (k: string) =>
        Number((testConfig as Record<string, string>)[k]),
    } as unknown as ConfigService;

    const cache = new MemoryCache();
    const redis = { getClient: () => cache };
    const email = { send: emailSend };

    const prisma = {
      user: {
        findUnique: prismaFindUnique,
        update: prismaUpdate,
      },
      driver: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'driver-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest
        .fn()
        .mockImplementation((queries) => Promise.all(queries)),
    };

    const tokens = {
      issueAccessToken: jest.fn().mockResolvedValue('access-token'),
      createRefreshToken: jest
        .fn()
        .mockResolvedValue({ token: 'refresh-token', expiresInMs: 1000 }),
      revokeUserRefreshTokens: revokeTokens,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        PasswordResetService,
        EmailOtpService,
        { provide: ConfigService, useValue: config },
        { provide: EmailService, useValue: email },
        { provide: TokenService, useValue: tokens },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: OtpService, useValue: {} },
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  function lastEmail(): { to: string; html: string; text: string } {
    return emailSend.mock.calls.at(-1)[0] as {
      to: string;
      html: string;
      text: string;
    };
  }

  it('forgot sends a reset email and reset completes the change', async () => {
    await request(app.getHttpServer())
      .post('/auth/password/forgot')
      .send({ email: 'Probe@Saferide.com' })
      .expect(200);

    const sent = lastEmail();
    expect(sent.to).toBe('probe@saferide.com');
    expect(sent.html).toContain(
      'https://saferide.rw/auth/reset-password?token=',
    );
    const token = /token=([A-Za-z0-9_-]+)/.exec(sent.html)![1];

    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token, password: 'newSecret123' })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });

    expect(prismaUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          passwordHash: expect.stringContaining(':'),
          tokenVersion: { increment: 1 },
        }),
      }),
    );
    expect(revokeTokens).toHaveBeenCalledWith('user-1');
  });

  it('forgot returns the same message for an unknown email', async () => {
    prismaFindUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/auth/password/forgot')
      .send({ email: 'nobody@example.com' })
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
      });
    expect(emailSend).not.toHaveBeenCalled();
  });

  it('reset rejects a token that was already used', async () => {
    await request(app.getHttpServer())
      .post('/auth/password/forgot')
      .send({ email: 'probe@saferide.com' })
      .expect(200);
    const token = /token=([A-Za-z0-9_-]+)/.exec(lastEmail().html)![1];

    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token, password: 'newSecret123' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token, password: 'anotherPass123' })
      .expect(400);
  });

  it('reset rejects a bogus token with 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token: 'not-a-real-token', password: 'newSecret123' })
      .expect(400);
  });

  it('validates input (missing password)', async () => {
    await request(app.getHttpServer())
      .post('/auth/password/reset')
      .send({ token: 'some-token' })
      .expect(400);
  });
});
