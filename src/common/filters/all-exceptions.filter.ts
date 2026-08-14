import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
  path: string;
}

interface PrismaErrorMapping {
  status: HttpStatus;
  code: string;
  message: string;
}

const PRISMA_ERROR_MAP: Record<string, PrismaErrorMapping> = {
  P1001: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    code: 'DB_UNAVAILABLE',
    message:
      'The service is temporarily unavailable. Please try again shortly.',
  },
  P1002: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    code: 'DB_TIMEOUT',
    message:
      'The service is temporarily unavailable. Please try again shortly.',
  },
  P1008: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    code: 'DB_TIMEOUT',
    message:
      'The service is temporarily unavailable. Please try again shortly.',
  },
  P1012: {
    status: HttpStatus.BAD_REQUEST,
    code: 'DB_VALIDATION_ERROR',
    message: 'Invalid request payload.',
  },
  P2002: {
    status: HttpStatus.CONFLICT,
    code: 'CONFLICT',
    message: 'A record with these details already exists.',
  },
  P2003: {
    status: HttpStatus.CONFLICT,
    code: 'CONFLICT',
    message: 'The operation conflicts with existing data.',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    code: 'NOT_FOUND',
    message: 'The requested record was not found.',
  },
};

function mapPrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): PrismaErrorMapping {
  return (
    PRISMA_ERROR_MAP[err.code] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    }
  );
}

function isPrismaKnownError(
  err: unknown,
): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

function isPrismaConnectionError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  );
}

function httpStatusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'TOO_MANY_REQUESTS';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'UNPROCESSABLE_ENTITY';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        body = {
          code: httpStatusToCode(status),
          message: res,
          requestId,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        body = {
          code: typeof r.code === 'string' ? r.code : httpStatusToCode(status),
          message:
            (typeof r.message === 'string' ? r.message : exception.message) ??
            'Request failed',
          details: Array.isArray(r.message) ? r.message : undefined,
          requestId,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      } else {
        body = {
          code: httpStatusToCode(status),
          message: exception.message,
          requestId,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }
    } else if (isPrismaKnownError(exception)) {
      const mapping = mapPrismaError(exception);
      status = mapping.status;
      body = {
        code: mapping.code,
        message: mapping.message,
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      this.logger.error(
        `Prisma error ${exception.code} on ${request.method} ${request.url}`,
        exception.stack,
        {
          requestId,
          meta: exception.meta,
        },
      );
    } else if (isPrismaConnectionError(exception)) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      body = {
        code: 'DB_UNAVAILABLE',
        message:
          'The service is temporarily unavailable. Please try again shortly.',
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
      this.logger.error(
        `Database connection error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
        { requestId },
      );
    } else {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url} (${request.ip}): ${
          exception instanceof Error
            ? exception.message
            : 'Internal server error'
        }`,
        exception instanceof Error ? exception.stack : undefined,
        { requestId },
      );
      body = {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    response.status(status).json(body);
  }
}
