export declare class RequestOtpDto {
    phone: string;
}
export declare class VerifyOtpDto {
    phone: string;
    code?: string;
    role?: 'PASSENGER' | 'DRIVER';
    name?: string;
}
export declare class LoginDto {
    identifier: string;
    password: string;
}
export declare class RegisterDto {
    phone: string;
    password: string;
    username?: string;
    email?: string;
    name?: string;
    role?: 'PASSENGER' | 'DRIVER';
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class LogoutDto {
    refreshToken: string;
}
