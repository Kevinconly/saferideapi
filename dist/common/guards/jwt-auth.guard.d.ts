import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
export interface JwtPayload {
    sub: string;
    role: string;
    phone?: string;
    email?: string;
}
export declare class JwtAuthGuard implements CanActivate {
    private reflector;
    private jwtService;
    private config;
    constructor(reflector: Reflector, jwtService: JwtService, config: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
