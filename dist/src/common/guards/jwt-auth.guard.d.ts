import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    role: string;
    phone?: string;
    email?: string;
    tokenVersion?: number;
}
export declare class JwtAuthGuard implements CanActivate {
    private reflector;
    private jwtService;
    private config;
    private prisma;
    constructor(reflector: Reflector, jwtService: JwtService, config: ConfigService, prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
