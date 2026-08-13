import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OtpService } from './otp.service';
import { TokenService, TokenPair } from './token.service';
export declare function normalizePhone(input: string): string;
export declare class AuthService {
    private prisma;
    private otp;
    private tokens;
    private audit;
    private config;
    constructor(prisma: PrismaService, otp: OtpService, tokens: TokenService, audit: AuditService, config: ConfigService);
    requestOtp(input: {
        phone: string;
    }): Promise<{
        sent: boolean;
        devCode?: string;
    }>;
    signup(input: {
        phone: string;
        password: string;
        username?: string;
        email?: string;
        name?: string;
        role?: 'PASSENGER' | 'DRIVER';
        ip?: string | null;
        userAgent?: string | null;
    }): Promise<{
        user: unknown;
        tokens: TokenPair;
    }>;
    verifyOtp(input: {
        phone: string;
        code: string;
        role?: 'PASSENGER' | 'DRIVER';
        name?: string;
        ip?: string | null;
        userAgent?: string | null;
    }): Promise<{
        user: unknown;
        tokens: TokenPair;
    }>;
    login(input: {
        identifier: string;
        password?: string;
        ip?: string | null;
        userAgent?: string | null;
    }): Promise<{
        user: unknown;
        tokens: TokenPair;
    }>;
    refresh(refreshToken: string): Promise<TokenPair>;
    logout(refreshToken: string): Promise<void>;
    me(userId: string): Promise<{
        id: string;
        phone: string;
        username: string | null;
        email: string | null;
        name: string | null;
        role: string;
        isVerified: boolean;
        status: string;
        driver: {} | null;
    }>;
    private createSession;
    private sanitize;
}
export declare function hashPassword(password: string): string;
