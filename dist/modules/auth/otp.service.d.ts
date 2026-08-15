import { ConfigService } from '../../config/config.service';
import { RedisService } from '../../common/redis.service';
export declare class OtpService {
    private config;
    private redis;
    private readonly expirySeconds;
    private readonly maxPerHour;
    private readonly maxFailedAttempts;
    constructor(config: ConfigService, redis: RedisService);
    isAutoVerify(): boolean;
    private key;
    private codeHash;
    private rateLimitCheck;
    generate(phone: string): Promise<{
        code: string;
        devCode: boolean;
    }>;
    verify(phone: string, code: string): Promise<boolean>;
}
