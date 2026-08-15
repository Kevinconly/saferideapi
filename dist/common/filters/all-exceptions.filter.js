"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const PRISMA_ERROR_MAP = {
    P1001: {
        status: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DB_UNAVAILABLE',
        message: 'The service is temporarily unavailable. Please try again shortly.',
    },
    P1002: {
        status: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DB_TIMEOUT',
        message: 'The service is temporarily unavailable. Please try again shortly.',
    },
    P1008: {
        status: common_1.HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DB_TIMEOUT',
        message: 'The service is temporarily unavailable. Please try again shortly.',
    },
    P1012: {
        status: common_1.HttpStatus.BAD_REQUEST,
        code: 'DB_VALIDATION_ERROR',
        message: 'Invalid request payload.',
    },
    P2002: {
        status: common_1.HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'A record with these details already exists.',
    },
    P2003: {
        status: common_1.HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'The operation conflicts with existing data.',
    },
    P2025: {
        status: common_1.HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        message: 'The requested record was not found.',
    },
};
function mapPrismaError(err) {
    return (PRISMA_ERROR_MAP[err.code] ?? {
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
    });
}
function isPrismaKnownError(err) {
    return err instanceof client_1.Prisma.PrismaClientKnownRequestError;
}
function isPrismaConnectionError(err) {
    return (err instanceof client_1.Prisma.PrismaClientInitializationError ||
        err instanceof client_1.Prisma.PrismaClientUnknownRequestError);
}
function httpStatusToCode(status) {
    switch (status) {
        case common_1.HttpStatus.BAD_REQUEST:
            return 'BAD_REQUEST';
        case common_1.HttpStatus.UNAUTHORIZED:
            return 'UNAUTHORIZED';
        case common_1.HttpStatus.FORBIDDEN:
            return 'FORBIDDEN';
        case common_1.HttpStatus.NOT_FOUND:
            return 'NOT_FOUND';
        case common_1.HttpStatus.CONFLICT:
            return 'CONFLICT';
        case common_1.HttpStatus.TOO_MANY_REQUESTS:
            return 'TOO_MANY_REQUESTS';
        case common_1.HttpStatus.UNPROCESSABLE_ENTITY:
            return 'UNPROCESSABLE_ENTITY';
        case common_1.HttpStatus.SERVICE_UNAVAILABLE:
            return 'SERVICE_UNAVAILABLE';
        default:
            return 'INTERNAL_SERVER_ERROR';
    }
}
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new common_1.Logger('Exceptions');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const requestId = (0, crypto_1.randomUUID)();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let body;
        if (exception instanceof common_1.HttpException) {
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
            }
            else if (typeof res === 'object' && res !== null) {
                const r = res;
                body = {
                    code: typeof r.code === 'string' ? r.code : httpStatusToCode(status),
                    message: (typeof r.message === 'string' ? r.message : exception.message) ??
                        'Request failed',
                    details: Array.isArray(r.message) ? r.message : undefined,
                    requestId,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                };
            }
            else {
                body = {
                    code: httpStatusToCode(status),
                    message: exception.message,
                    requestId,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                };
            }
        }
        else if (isPrismaKnownError(exception)) {
            const mapping = mapPrismaError(exception);
            status = mapping.status;
            body = {
                code: mapping.code,
                message: mapping.message,
                requestId,
                timestamp: new Date().toISOString(),
                path: request.url,
            };
            this.logger.error(`Prisma error ${exception.code} on ${request.method} ${request.url}`, exception.stack, {
                requestId,
                meta: exception.meta,
            });
        }
        else if (isPrismaConnectionError(exception)) {
            status = common_1.HttpStatus.SERVICE_UNAVAILABLE;
            body = {
                code: 'DB_UNAVAILABLE',
                message: 'The service is temporarily unavailable. Please try again shortly.',
                requestId,
                timestamp: new Date().toISOString(),
                path: request.url,
            };
            this.logger.error(`Database connection error on ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : undefined, { requestId });
        }
        else {
            this.logger.error(`Unhandled error on ${request.method} ${request.url} (${request.ip}): ${exception instanceof Error
                ? exception.message
                : 'Internal server error'}`, exception instanceof Error ? exception.stack : undefined, { requestId });
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
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map