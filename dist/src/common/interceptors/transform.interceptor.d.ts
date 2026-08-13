import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface Envelope<T = unknown> {
    success: true;
    data: T;
    meta?: Record<string, unknown>;
    timestamp: string;
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T>>;
}
