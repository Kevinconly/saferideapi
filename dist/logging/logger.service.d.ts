import { LoggerService } from '@nestjs/common';
export declare class Logger implements LoggerService {
    private logger;
    log(message: string, ...meta: any[]): void;
    error(message: string, trace?: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
}
