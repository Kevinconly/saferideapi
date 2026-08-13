import { ConfigService } from '../config/config.service';
type SetValue = string | number;
interface CacheClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: SetValue, mode?: string, ttlSeconds?: number): Promise<unknown>;
    del(...keys: string[]): Promise<number>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    ping(): Promise<string>;
}
export declare class RedisService {
    private config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    getClient(): CacheClient;
    ping(): Promise<boolean>;
}
export {};
