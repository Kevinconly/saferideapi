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
};

describe('Email OTP endpoints (integration)', () => {
  let app: INestApplication<App>;
  let emailSend: jest.Mock;
  let prismaFindUnique: jest.Mock;
  let prismaUpdate: jest.Mock;

  beforeEach(async () => {
    emailSend = jest.fn().mockResolvedValue(undefined);
    prismaFindUnique = jest.fn();
    prismaUpdate = jest.fn();

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
    };

    const tokens = {
      issueAccessToken: jest.fn().mockResolvedValue('access-token'),
      createRefreshToken: jest
        .fn()
        .mockResolvedValue({ token: 'refresh-token', expiresInMs: 1000 }),
      revokeUserRefreshTokens: jest.fn().mockResolvedValue(undefined),
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

  it('request-otp returns a generic success message', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/email/request-otp')
      .send({ email: 'customer@saferide.com' })
      .expect(200);

    expect(res.body).toEqual({
      success: true,
      message: 'If this email is eligible, a verification code has been sent.',
    });
    expect(emailSend).toHaveBeenCalledTimes(1);
  });

  it('request-otp validates the email format', async () => {
    await request(app.getHttpServer())
      .post('/auth/email/request-otp')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('verify-otp marks the user verified and issues tokens', async () => {
    prismaFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'customer@saferide.com',
      role: 'PASSENGER',
      phone: '+250789001234',
      status: 'ACTIVE',
      tokenVersion: 0,
    });
    prismaUpdate.mockResolvedValue({
      id: 'user-1',
      email: 'customer@saferide.com',
      role: 'PASSENGER',
      phone: '+250789001234',
      status: 'ACTIVE',
      tokenVersion: 1,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await request(app.getHttpServer())
      .post('/auth/email/request-otp')
      .send({ email: 'customer@saferide.com' })
      .expect(200);

    const payload = emailSend.mock.calls[0][0] as { text: string };
    const code = /code is (\d{6})/.exec(payload.text)![1];

    const res = await request(app.getHttpServer())
      .post('/auth/email/verify-otp')
      .send({ email: 'customer@saferide.com', otp: code })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user).toMatchObject({
      id: 'user-1',
      email: 'customer@saferide.com',
      isEmailVerified: true,
    });
    expect(res.body.accessToken).toBe('access-token');
    expect(res.body.refreshToken).toBe('refresh-token');
    expect(prismaUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: expect.any(Date),
      },
    });
  });

  it('verify-otp rejects an invalid code', async () => {
    await request(app.getHttpServer())
      .post('/auth/email/request-otp')
      .send({ email: 'customer@saferide.com' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/email/verify-otp')
      .send({ email: 'customer@saferide.com', otp: '999999' })
      .expect(400);
  });

  it('verify-otp rejects a mismatched email', async () => {
    await request(app.getHttpServer())
      .post('/auth/email/request-otp')
      .send({ email: 'customer@saferide.com' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/email/verify-otp')
      .send({ email: 'other@saferide.com', otp: '000000' })
      .expect(400);
  });
});
