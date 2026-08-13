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
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new common_1.Logger('Exceptions');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let body;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                body = {
                    code: httpStatusToCode(status),
                    message: res,
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
                    timestamp: new Date().toISOString(),
                    path: request.url,
                };
            }
            else {
                body = {
                    code: httpStatusToCode(status),
                    message: exception.message,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                };
            }
        }
        else {
            const message = exception instanceof Error
                ? exception.message
                : 'Internal server error';
            this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
            body = {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Internal server error',
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
        default:
            return 'INTERNAL_SERVER_ERROR';
    }
}
//# sourceMappingURL=all-exceptions.filter.js.map