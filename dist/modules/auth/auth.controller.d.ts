import { Request } from 'express';
import type { AuthUser } from '../../common/types/auth-user';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto, RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    requestOtp(dto: RequestOtpDto): Promise<{
        sent: boolean;
        devCode?: string;
    }>;
    verifyOtp(dto: VerifyOtpDto, req: Request): Promise<{
        user: unknown;
        tokens: import("./token.service").TokenPair;
    }>;
    signup(dto: RegisterDto, req: Request): Promise<{
        user: unknown;
        tokens: import("./token.service").TokenPair;
    }>;
    login(dto: LoginDto, req: Request): Promise<{
        user: unknown;
        tokens: import("./token.service").TokenPair;
    }>;
    refresh(dto: RefreshTokenDto): Promise<import("./token.service").TokenPair>;
    logout(dto: LogoutDto): Promise<{
        success: boolean;
    }>;
    me(user: AuthUser): Promise<{
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
}
