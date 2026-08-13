import { HttpException, HttpStatus } from '@nestjs/common';
export declare class AppError extends HttpException {
    readonly code?: string | undefined;
    constructor(message: string, status?: HttpStatus, code?: string | undefined);
}
export declare const Errors: {
    notFound: (msg?: string) => AppError;
    conflict: (msg: string, code?: string) => AppError;
    forbidden: (msg?: string) => AppError;
    unauthorized: (msg?: string) => AppError;
    badRequest: (msg: string, code?: string) => AppError;
};
