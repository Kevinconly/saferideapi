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
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const config_service_1 = require("../../config/config.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let TokenService = class TokenService {
    jwt;
    prisma;
    config;
    constructor(jwt, prisma, config) {
        this.jwt = jwt;
        this.prisma = prisma;
        this.config = config;
    }
    async issueAccessToken(user) {
        return this.jwt.signAsync({
            sub: user.id,
            role: user.role,
            phone: user.phone ?? undefined,
            email: user.email ?? undefined,
        }, {
            secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_TOKEN_EXPIRES_IN'),
        });
    }
    generateRefreshToken() {
        const token = (0, crypto_1.randomBytes)(48).toString('base64url');
        const hash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
        return { token, hash };
    }
    async createRefreshToken(userId) {
        const { token, hash } = this.generateRefreshToken();
        const expiresIn = this.config.get('JWT_REFRESH_TOKEN_EXPIRES_IN');
        const ttlMs = parseDuration(expiresIn);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + ttlMs),
            },
        });
        return { token, expiresInMs: ttlMs };
    }
    async rotateRefreshToken(oldToken) {
        const oldHash = (0, crypto_1.createHash)('sha256').update(oldToken).digest('hex');
        const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash: oldHash } });
        if (!existing || existing.revoked || existing.expiresAt < new Date()) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
        await this.prisma.refreshToken.update({
            where: { id: existing.id },
            data: { revoked: true },
        });
        const { token, hash } = this.generateRefreshToken();
        const ttlMs = parseDuration(this.config.get('JWT_REFRESH_TOKEN_EXPIRES_IN'));
        await this.prisma.refreshToken.create({
            data: {
                userId: existing.userId,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + ttlMs),
            },
        });
        const user = await this.prisma.user.findUnique({ where: { id: existing.userId } });
        if (!user)
            throw new Error('USER_NOT_FOUND');
        const accessToken = await this.issueAccessToken(user);
        return { accessToken, refreshToken: token, expiresIn: ttlMs };
    }
    async revokeRefreshToken(refreshToken) {
        const hash = (0, crypto_1.createHash)('sha256').update(refreshToken).digest('hex');
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash: hash, revoked: false },
            data: { revoked: true },
        });
    }
    hashSecret(value) {
        return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService,
        config_service_1.ConfigService])
], TokenService);
function parseDuration(value) {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match)
        return 30 * 24 * 60 * 60 * 1000;
    const n = parseInt(match[1], 10);
    switch (match[2]) {
        case 's':
            return n * 1000;
        case 'm':
            return n * 60 * 1000;
        case 'h':
            return n * 60 * 60 * 1000;
        case 'd':
            return n * 24 * 60 * 60 * 1000;
        default:
            return 30 * 24 * 60 * 60 * 1000;
    }
}
//# sourceMappingURL=token.service.js.map