import { describe, it, expect, jest } from '@jest/globals';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthService } from '../../src/modules/auth/auth.service';

const userRecord = {
  id: 'user-1',
  phone: '+250789001234',
  username: 'probe',
  email: 'probe@saferide.com',
  name: 'Probe',
  role: 'PASSENGER',
  status: 'ACTIVE',
  isVerified: false,
  isPhoneVerified: false,
  tokenVersion: 0,
  driver: null,
};

function createService(overrides: {
  findFirst?: jest.Mock;
  findUnique?: jest.Mock;
  create?: jest.Mock;
  delete?: jest.Mock;
  update?: jest.Mock;
  createRefreshToken?: jest.Mock;
  revokeUserRefreshTokens?: jest.Mock;
  issueAccessToken?: jest.Mock;
  auditRecord?: jest.Mock;
}) {
  const prisma = {
    user: {
      findFirst: overrides.findFirst ?? jest.fn().mockResolvedValue(null),
      findUnique: overrides.findUnique ?? jest.fn().mockResolvedValue(null),
      create: overrides.create ?? jest.fn().mockResolvedValue(userRecord),
      update:
        overrides.update ??
        jest.fn().mockResolvedValue({ ...userRecord, tokenVersion: 1 }),
      delete: overrides.delete ?? jest.fn().mockResolvedValue(userRecord),
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
  };
  const tokens = {
    revokeUserRefreshTokens:
      overrides.revokeUserRefreshTokens ??
      jest.fn().mockResolvedValue(undefined),
    createRefreshToken:
      overrides.createRefreshToken ??
      jest
        .fn()
        .mockResolvedValue({ token: 'refresh-token', expiresInMs: 1000 }),
    issueAccessToken:
      overrides.issueAccessToken ?? jest.fn().mockResolvedValue('access-token'),
  };
  const audit = {
    record: overrides.auditRecord ?? jest.fn().mockResolvedValue(undefined),
  };
  const emailOtp = {
    request: jest.fn().mockResolvedValue(undefined),
    verify: jest.fn().mockResolvedValue(true),
  };
  const service = new AuthService(
    prisma as any,
    {} as any,
    tokens as any,
    audit as any,
    {} as any,
    emailOtp as any,
  );
  return { service, prisma, tokens, audit, emailOtp };
}

describe('AuthService.signup', () => {
  it('creates an email-first user and returns sanitized user with tokens', async () => {
    const { service, prisma, tokens, audit } = createService({});

    const result = await service.signup({
      email: 'PROBE@saferide.com',
      password: 'secret123',
      phone: '0789001234',
      username: 'Probe',
      name: 'Probe',
      role: 'PASSENGER',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'probe@saferide.com',
          phone: '+250789001234',
          username: 'probe',
          role: 'PASSENGER',
          status: 'ACTIVE',
          isVerified: true,
          isPhoneVerified: false,
          isEmailVerified: false,
          passwordHash: expect.stringContaining(':'),
        }),
      }),
    );
    expect(tokens.issueAccessToken).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'auth.signup', actorId: 'user-1' }),
    );
    expect(result.user).toMatchObject({
      id: 'user-1',
      email: 'probe@saferide.com',
      role: 'PASSENGER',
    });
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 1000,
    });
  });

  it('creates an account without a phone', async () => {
    const { service, prisma } = createService({});

    await service.signup({
      email: 'probe@saferide.com',
      password: 'secret123',
      username: 'Probe',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'probe@saferide.com',
          phone: null,
          username: 'probe',
        }),
      }),
    );
  });

  it('creates a PENDING Driver profile when role is DRIVER', async () => {
    const { service, prisma } = createService({
      create: jest.fn().mockResolvedValue({ ...userRecord, role: 'DRIVER' }),
    });

    await service.signup({
      email: 'driver@saferide.com',
      password: 'secret123',
      role: 'DRIVER',
    });

    expect(prisma.driver.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          status: 'PENDING',
          isVerified: false,
        }),
      }),
    );
  });

  it('rejects duplicate email or username with ConflictException', async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue({ id: 'existing' }),
    });

    await expect(
      service.signup({
        email: 'probe@saferide.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a unique-constraint race to ConflictException', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`email`)',
      { code: 'P2002', clientVersion: '5.22.0' },
    );
    const { service } = createService({
      create: jest.fn().mockRejectedValue(prismaError),
    });

    await expect(
      service.signup({ email: 'probe@saferide.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rolls back the created user if session creation fails', async () => {
    const { service, prisma } = createService({
      createRefreshToken: jest
        .fn()
        .mockRejectedValue(new Error('token service down')),
    });

    await expect(
      service.signup({ email: 'probe@saferide.com', password: 'secret123' }),
    ).rejects.toThrow('token service down');

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });
});

describe('AuthService.checkUsernameAvailable', () => {
  function createServiceWithFindFirst(findFirst: jest.Mock): {
    service: AuthService;
    prisma: any;
  } {
    return createService({ findFirst });
  }

  it('returns available for a free normalized username', async () => {
    const { service } = createServiceWithFindFirst(
      jest.fn().mockResolvedValue(null),
    );

    await expect(
      service.checkUsernameAvailable('  Probe_1  '),
    ).resolves.toEqual({ available: true, normalized: 'probe_1' });
  });

  it('returns unavailable with suggestions for a taken username', async () => {
    let call = 0;
    const findFirst = jest.fn().mockImplementation(() => {
      call += 1;
      return Promise.resolve(call === 1 ? { id: 'taken' } : null);
    });
    const { service } = createServiceWithFindFirst(findFirst);

    await expect(service.checkUsernameAvailable('probe')).resolves.toEqual({
      available: false,
      normalized: 'probe',
      suggestions: ['probe_1', 'probe_2', 'probe_3'],
    });
    expect(findFirst).toHaveBeenCalledTimes(4);
  });

  it('rejects invalid usernames without a database query', async () => {
    const findFirst = jest.fn();
    const { service } = createServiceWithFindFirst(findFirst);

    await expect(service.checkUsernameAvailable('a!b@c')).resolves.toEqual({
      available: false,
      suggestions: [],
    });
    expect(findFirst).not.toHaveBeenCalled();
  });
});

describe('AuthService.checkEmailAvailable', () => {
  it('returns available for a free normalized email', async () => {
    const { service } = createService({
      findUnique: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.checkEmailAvailable('  Probe@Saferide.com '),
    ).resolves.toEqual({ available: true, normalized: 'probe@saferide.com' });
  });

  it('returns unavailable for an already-registered email', async () => {
    const { service } = createService({
      findUnique: jest.fn().mockResolvedValue({ id: 'existing' }),
    });

    await expect(
      service.checkEmailAvailable('taken@saferide.com'),
    ).resolves.toEqual({
      available: false,
      normalized: 'taken@saferide.com',
    });
  });

  it('rejects invalid emails without a database query', async () => {
    const findUnique = jest.fn();
    const { service } = createService({ findUnique });

    await expect(service.checkEmailAvailable('not-an-email')).resolves.toEqual({
      available: false,
      normalized: 'not-an-email',
    });
    expect(findUnique).not.toHaveBeenCalled();
  });
});

describe('AuthService.signup conflict messages', () => {
  it('reports an existing email precisely', async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'probe@saferide.com',
        phone: '+250789001234',
        username: 'other',
      }),
    });

    await expect(
      service.signup({ email: 'probe@saferide.com', password: 'secret123' }),
    ).rejects.toThrow('An account with this email is already registered');
  });

  it('reports an existing phone precisely', async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'other@saferide.com',
        phone: '+250789001234',
        username: 'other',
      }),
    });

    await expect(
      service.signup({
        email: 'probe@saferide.com',
        password: 'secret123',
        phone: '0789001234',
      }),
    ).rejects.toThrow(
      'This phone number is already registered to another account',
    );
  });

  it('reports an existing username precisely', async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'other@saferide.com',
        phone: '+250700000000',
        username: 'probe',
      }),
    });

    await expect(
      service.signup({
        email: 'probe@saferide.com',
        password: 'secret123',
        username: 'Probe',
      }),
    ).rejects.toThrow('This username is already taken');
  });
});
