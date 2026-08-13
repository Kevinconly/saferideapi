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
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const config_service_1 = require("../../config/config.service");
const redis_service_1 = require("../../common/redis.service");
let OtpService = class OtpService {
    config;
    redis;
    expirySeconds;
    maxPerHour;
    maxFailedAttempts;
    constructor(config, redis) {
        this.config = config;
        this.redis = redis;
        this.expirySeconds = config.getNumber('OTP_EXPIRY_SECONDS');
        this.maxPerHour = config.getNumber('OTP_MAX_PER_HOUR');
        this.maxFailedAttempts = config.getNumber('OTP_MAX_FAILED_ATTEMPTS');
    }
    key(phone) {
        return `otp:${phone}`;
    }
    codeHash(code) {
        return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
    }
    async rateLimitCheck(phone) {
        const client = this.redis.getClient();
        const windowKey = `otp:rate:${phone}`;
        const current = await client.incr(windowKey);
        if (current === 1) {
            await client.expire(windowKey, 3600);
        }
        return current <= this.maxPerHour;
    }
    async generate(phone) {
        const allowed = await this.rateLimitCheck(phone);
        if (!allowed)
            throw new Error('OTP_RATE_LIMITED');
        const code = String((0, crypto_1.randomInt)(100000, 999999));
        const record = {
            hash: this.codeHash(code),
            expiresAt: Date.now() + this.expirySeconds * 1000,
            attempts: 0,
            createdAt: Date.now(),
        };
        await this.redis.getClient().set(this.key(phone), JSON.stringify(record), 'EX', this.expirySeconds);
        const isMock = this.config.get('SMS_MOCK') === 'true';
        return { code, devCode: isMock };
    }
    async verify(phone, code) {
        const raw = await this.redis.getClient().get(this.key(phone));
        if (!raw)
            return false;
        const record = JSON.parse(raw);
        if (record.expiresAt < Date.now()) {
            await this.redis.getClient().del(this.key(phone));
            return false;
        }
        if (record.attempts >= this.maxFailedAttempts)
            return false;
        if (record.hash !== this.codeHash(code.trim())) {
            record.attempts += 1;
            await this.redis.getClient().set(this.key(phone), JSON.stringify(record), 'EX', this.expirySeconds);
            return false;
        }
        await this.redis.getClient().del(this.key(phone));
        return true;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService,
        redis_service_1.RedisService])
], OtpService);
//# sourceMappingURL=otp.service.js.map