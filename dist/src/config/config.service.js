"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().default('3000'),
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().optional().default(''),
    FRONTEND_ORIGIN: zod_1.z.string().optional(),
    CORS_ORIGINS: zod_1.z.string().optional(),
    JWT_ACCESS_TOKEN_SECRET: zod_1.z.string().min(1),
    JWT_REFRESH_TOKEN_SECRET: zod_1.z.string().min(1),
    JWT_ACCESS_TOKEN_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('30d'),
    OTP_EXPIRY_SECONDS: zod_1.z.coerce.number().default(300),
    OTP_MAX_PER_HOUR: zod_1.z.coerce.number().default(5),
    OTP_MAX_PER_DAY_PER_IP: zod_1.z.coerce.number().default(20),
    OTP_MAX_FAILED_ATTEMPTS: zod_1.z.coerce.number().default(5),
    VAPID_PUBLIC_KEY: zod_1.z.string().optional(),
    VAPID_PRIVATE_KEY: zod_1.z.string().optional(),
    VAPID_SUBJECT: zod_1.z.string().default('mailto:ops@saferide.rw'),
    SWAGGER_ENABLED: zod_1.z.string().default('true'),
    LOG_LEVEL: zod_1.z.string().default('info'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3001'),
    ADMIN_URL: zod_1.z.string().default('http://localhost:3001/admin'),
    SMS_MOCK: zod_1.z.string().default('true'),
    SANDBOX_WEBHOOK_SECRET: zod_1.z.string().optional(),
    PAYMENT_POLL_INTERVAL_MS: zod_1.z.coerce.number().default(3000),
    PAYMENT_AUTO_CONFIRM_MS: zod_1.z.coerce.number().default(5000),
});
let ConfigService = class ConfigService {
    config;
    constructor() {
        const parsed = envSchema.safeParse(process.env);
        if (!parsed.success) {
            console.error('Invalid environment variables', parsed.error.format());
            throw new Error('Invalid environment variables');
        }
        this.config = parsed.data;
    }
    get(key) {
        return this.config[key];
    }
    getNumber(key) {
        const val = this.get(key);
        return Number(val);
    }
    getCorsOrigins() {
        const fromOrigin = this.config.FRONTEND_ORIGIN;
        const fromList = this.config.CORS_ORIGINS;
        if (fromList) {
            return fromList
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }
        if (fromOrigin)
            return [fromOrigin];
        return ['http://localhost:3001'];
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ConfigService);
//# sourceMappingURL=config.service.js.map