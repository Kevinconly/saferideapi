import { describe, it, expect, jest } from '@jest/globals';
import { ConflictException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';

function createContext() {
  const json = jest.fn();
  const response = {
    status: jest.fn(() => ({ json })),
    json,
  };
  const request = {
    url: '/api/v1/auth/signup',
    method: 'POST',
    ip: '127.0.0.1',
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  };
  return { filter: new AllExceptionsFilter(), host, response, request };
}

describe('AllExceptionsFilter', () => {
  it('keeps HttpException status and message', () => {
    const { filter, host, response } = createContext();
    const exception = new ConflictException('already exists');

    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CONFLICT',
        message: 'already exists',
      }),
    );
  });

  it('maps Prisma unique violation P2002 to 409', () => {
    const { filter, host, response } = createContext();
    const exception = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '5.22.0' },
    );

    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CONFLICT',
        requestId: expect.any(String),
      }),
    );
  });

  it('maps Prisma connection errors to 503 without leaking internals', () => {
    const { filter, host, response } = createContext();
    const exception = new Prisma.PrismaClientInitializationError(
      "Can't reach database server",
      '5.22.0',
    );

    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'DB_UNAVAILABLE',
        message:
          'The service is temporarily unavailable. Please try again shortly.',
      }),
    );
  });

  it('maps P2025 to 404', () => {
    const { filter, host, response } = createContext();
    const exception = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      { code: 'P2025', clientVersion: '5.22.0' },
    );

    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('returns generic 500 with requestId for unexpected errors', () => {
    const { filter, host, response } = createContext();
    const exception = new Error('boom');

    filter.catch(exception, host as any);

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const body = response.json.mock.calls[0][0];
    expect(body).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
    expect(body.requestId).toEqual(expect.any(String));
    expect(body.message).not.toBe('boom');
  });
});
