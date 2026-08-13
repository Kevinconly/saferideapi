import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class TokenService {
    private jwt;
    private prisma;
    private config;
    constructor(jwt: JwtService, prisma: PrismaService, config: ConfigService);
    issueAccessToken(user: {
        id: string;
        role: string;
        phone?: string | null;
        email?: string | null;
        tokenVersion?: number;
    }): Promise<string>;
    revokeUserRefreshTokens(userId: string): Promise<void>;
    private generateRefreshToken;
    createRefreshToken(userId: string): Promise<{
        token: string;
        expiresInMs: number;
    }>;
    rotateRefreshToken(oldToken: string): Promise<TokenPair>;
    revokeRefreshToken(refreshToken: string): Promise<void>;
    hashSecret(value: string): string;
}
