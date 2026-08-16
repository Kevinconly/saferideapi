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

describe('Signup + username availability (integration)', () => {
  let app: INestApplication<App>;
  let prismaFindFirst: jest.Mock;
  let prismaFindUnique: jest.Mock;
  let prismaCreate: jest.Mock;
  let prismaUpdate: jest.Mock;
  let prismaDelete: jest.Mock;
  let emailSend: jest.Mock;

  beforeEach(async () => {
    prismaFindFirst = jest.fn().mockResolvedValue(null);
    prismaFindUnique = jest.fn().mockResolvedValue(null);
    prismaCreate = jest.fn().mockResolvedValue({
      id: 'user-1',
      email: 'probe@saferide.com',
      phone: null,
      username: 'probe',
      name: 'Probe',
      role: 'PASSENGER',
      status: 'ACTIVE',
      isVerified: true,
      isPhoneVerified: false,
      isEmailVerified: false,
      tokenVersion: 0,
    });
    prismaUpdate = jest.fn().mockResolvedValue({
      ...prismaCreate.getMockImplementation()(),
      tokenVersion: 1,
    });
    prismaDelete = jest.fn().mockResolvedValue({ id: 'user-1' });
    emailSend = jest.fn().mockResolvedValue(undefined);

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
        findFirst: prismaFindFirst,
        findUnique: prismaFindUnique,
        create: prismaCreate,
        update: prismaUpdate,
        delete: prismaDelete,
      },
      driver: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'driver-1',
          userId: 'user-1',
          status: 'PENDING',
          isVerified: false,
        }),
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

  it('signup creates an email-first account without a phone', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'Probe@Saferide.com',
        password: 'secret123',
        username: 'Probe',
        name: 'Probe',
      })
      .expect(201);

    expect(prismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'probe@saferide.com',
          phone: null,
          username: 'probe',
        }),
      }),
    );
    expect(res.body.user).toMatchObject({
      id: 'user-1',
      email: 'probe@saferide.com',
      username: 'probe',
    });
  });

  it('signup rejects a duplicate email with 409 and a precise message', async () => {
    prismaFindFirst.mockResolvedValueOnce({
      id: 'existing',
      email: 'probe@saferide.com',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'probe@saferide.com', password: 'secret123' })
      .expect(409);

    expect(res.body.message).toBe(
      'An account with this email is already registered',
    );
  });

  it('signup requires an email', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ password: 'secret123' })
      .expect(400);
  });

  it('username-available returns available for a free username', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/username-available')
      .query({ username: 'Probe_1' })
      .expect(200);

    expect(res.body).toEqual({
      available: true,
      normalized: 'probe_1',
    });
    expect(prismaFindFirst).toHaveBeenCalledWith({
      where: { username: 'probe_1' },
      select: { id: true },
    });
  });

  it('username-available returns taken with suggestions', async () => {
    let call = 0;
    prismaFindFirst.mockImplementation(() => {
      call += 1;
      return Promise.resolve(call === 1 ? { id: 'taken' } : null);
    });

    const res = await request(app.getHttpServer())
      .get('/auth/username-available')
      .query({ username: 'probe' })
      .expect(200);

    expect(res.body).toEqual({
      available: false,
      normalized: 'probe',
      suggestions: ['probe_1', 'probe_2', 'probe_3'],
    });
  });

  it('username-available rejects invalid usernames', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/username-available')
      .query({ username: 'a b@c!' })
      .expect(200);

    expect(res.body).toEqual({ available: false, suggestions: [] });
    expect(prismaFindFirst).not.toHaveBeenCalled();
  });
});
