"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.AppError = void 0;
const common_1 = require("@nestjs/common");
class AppError extends common_1.HttpException {
    code;
    constructor(message, status = common_1.HttpStatus.BAD_REQUEST, code) {
        super({ code: code ?? 'APP_ERROR', message }, status);
        this.code = code;
    }
}
exports.AppError = AppError;
exports.Errors = {
    notFound: (msg = 'Resource not found') => new AppError(msg, common_1.HttpStatus.NOT_FOUND, 'NOT_FOUND'),
    conflict: (msg, code = 'CONFLICT') => new AppError(msg, common_1.HttpStatus.CONFLICT, code),
    forbidden: (msg = 'Forbidden') => new AppError(msg, common_1.HttpStatus.FORBIDDEN, 'FORBIDDEN'),
    unauthorized: (msg = 'Unauthorized') => new AppError(msg, common_1.HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED'),
    badRequest: (msg, code = 'BAD_REQUEST') => new AppError(msg, common_1.HttpStatus.BAD_REQUEST, code),
};
//# sourceMappingURL=app-error.js.map