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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const config_service_1 = require("../config/config.service");
class MemoryCache {
    store = new Map();
    prune(key) {
        const entry = this.store.get(key);
        if (!entry)
            return false;
        if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return false;
        }
        return true;
    }
    async get(key) {
        if (!this.prune(key))
            return null;
        return String(this.store.get(key).value);
    }
    async set(key, value, _mode, ttlSeconds) {
        this.store.set(key, {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        });
        return 'OK';
    }
    async del(...keys) {
        let removed = 0;
        for (const key of keys) {
            if (this.store.delete(key))
                removed += 1;
        }
        return removed;
    }
    async incr(key) {
        const current = this.prune(key) ? Number(this.store.get(key).value) : 0;
        const next = current + 1;
        this.store.set(key, { value: next, expiresAt: null });
        return next;
    }
    async expire(key, seconds) {
        const entry = this.store.get(key);
        if (!entry)
            return 0;
        entry.expiresAt = Date.now() + seconds * 1000;
        return 1;
    }
    async ping() {
        return 'PONG';
    }
}
let RedisService = class RedisService {
    config;
    logger = new common_1.Logger('RedisService');
    client;
    constructor(config) {
        this.config = config;
        const url = this.config.get('REDIS_URL')?.trim();
        if (url && url !== 'memory') {
            const redis = new ioredis_1.default(url, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
            });
            redis.connect().catch((err) => {
                this.logger.warn(`Redis unreachable at ${url} - falling back to in-memory cache`, err);
                this.client = new MemoryCache();
            });
            redis.on('error', (err) => {
                this.logger.warn('Redis error', err);
            });
            this.client = redis;
        }
        else {
            this.logger.warn('REDIS_URL not set - using in-memory cache (local dev only)');
            this.client = new MemoryCache();
        }
    }
    getClient() {
        return this.client;
    }
    async ping() {
        try {
            const res = await this.getClient().ping();
            return res === 'PONG';
        }
        catch {
            return false;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map