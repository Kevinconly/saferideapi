export declare class RequestOtpDto {
    phone: string;
}
export declare class VerifyOtpDto {
    phone: string;
    code: string;
    role?: 'PASSENGER' | 'DRIVER';
    name?: string;
}
export declare class LoginDto {
    phone: string;
    password?: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class LogoutDto {
    refreshToken: string;
}
