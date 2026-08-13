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
        phone: string;
        password?: string;
        ip?: string | null;
        userAgent?: string | null;
    }): Promise<{
        user: unknown;
        tokens: TokenPair;
    } | {
        requiresOtp: true;
    }>;
    refresh(refreshToken: string): Promise<TokenPair>;
    logout(refreshToken: string, userId: string): Promise<void>;
    me(userId: string): Promise<{
        id: string;
        phone: string;
        email: string | null;
        name: string | null;
        role: string;
        isVerified: boolean;
        status: string;
        driver: {} | null;
    }>;
    private sanitize;
}
export declare function hashPassword(password: string): string;
