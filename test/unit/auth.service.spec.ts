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
  tokenVersion: 0,
  driver: null,
};

function createService(overrides: {
  findFirst?: jest.Mock;
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
      create: overrides.create ?? jest.fn().mockResolvedValue(userRecord),
      update:
        overrides.update ??
        jest.fn().mockResolvedValue({ ...userRecord, tokenVersion: 1 }),
      delete: overrides.delete ?? jest.fn().mockResolvedValue(userRecord),
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
  const service = new AuthService(
    prisma as any,
    {} as any,
    tokens as any,
    audit as any,
    {} as any,
  );
  return { service, prisma, tokens, audit };
}

describe('AuthService.signup', () => {
  it('creates a user and returns sanitized user with tokens', async () => {
    const { service, prisma, tokens, audit } = createService({});

    const result = await service.signup({
      phone: '0789001234',
      password: 'secret123',
      username: 'Probe',
      email: 'PROBE@saferide.com',
      name: 'Probe',
      role: 'PASSENGER',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '+250789001234',
          username: 'probe',
          email: 'probe@saferide.com',
          role: 'PASSENGER',
          status: 'ACTIVE',
          isVerified: true,
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
      phone: '+250789001234',
      role: 'PASSENGER',
    });
    expect(result.tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 1000,
    });
  });

  it('maps a unique-constraint race to ConflictException', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`phone`)',
      { code: 'P2002', clientVersion: '5.22.0' },
    );
    const { service } = createService({
      create: jest.fn().mockRejectedValue(prismaError),
    });

    await expect(
      service.signup({ phone: '0789001234', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rolls back the created user if session creation fails', async () => {
    const { service, prisma } = createService({
      createRefreshToken: jest
        .fn()
        .mockRejectedValue(new Error('token service down')),
    });

    await expect(
      service.signup({ phone: '0789001234', password: 'secret123' }),
    ).rejects.toThrow('token service down');

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });
});
