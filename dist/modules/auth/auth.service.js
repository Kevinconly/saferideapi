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
exports.AuthService = void 0;
exports.normalizePhone = normalizePhone;
exports.hashPassword = hashPassword;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const config_service_1 = require("../../config/config.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const otp_service_1 = require("./otp.service");
const token_service_1 = require("./token.service");
function normalizePhone(input) {
    let phone = input.replace(/[\s-]/g, '');
    if (phone.startsWith('+'))
        return phone;
    if (phone.startsWith('00'))
        return `+${phone.slice(2)}`;
    if (phone.startsWith('0'))
        return `+250${phone.slice(1)}`;
    if (phone.startsWith('7'))
        return `+250${phone}`;
    return `+${phone}`;
}
let AuthService = class AuthService {
    prisma;
    otp;
    tokens;
    audit;
    config;
    constructor(prisma, otp, tokens, audit, config) {
        this.prisma = prisma;
        this.otp = otp;
        this.tokens = tokens;
        this.audit = audit;
        this.config = config;
    }
    async requestOtp(input) {
        const phone = normalizePhone(input.phone);
        const { code, devCode } = await this.otp.generate(phone);
        if (this.config.get('SMS_MOCK') !== 'true') {
            console.log(`[SMS][mock off] OTP for ${phone}: ${code}`);
        }
        return { sent: true, devCode: devCode ? code : undefined };
    }
    async verifyOtp(input) {
        const phone = normalizePhone(input.phone);
        const valid = await this.otp.verify(phone, input.code);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        let user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    phone,
                    name: input.name ?? null,
                    role: input.role ?? 'PASSENGER',
                    isVerified: true,
                },
            });
        }
        else {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true, deletedAt: null },
            });
        }
        if (user.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Account is suspended');
        }
        const refreshToken = await this.tokens.createRefreshToken(user.id);
        const accessToken = await this.tokens.issueAccessToken(user);
        await this.audit.record({
            actorId: user.id,
            actorRole: user.role,
            action: 'auth.verify_otp',
            entityType: 'User',
            entityId: user.id,
            ip: input.ip,
            userAgent: input.userAgent,
        });
        return {
            user: this.sanitize(user),
            tokens: { accessToken, refreshToken: refreshToken.token, expiresIn: refreshToken.expiresInMs },
        };
    }
    async login(input) {
        const phone = normalizePhone(input.phone);
        const user = await this.prisma.user.findUnique({ where: { phone } });
        if (!user)
            throw new common_1.UnauthorizedException('Account not found');
        if (user.passwordHash && input.password) {
            const ok = verifyPassword(input.password, user.passwordHash);
            if (!ok)
                throw new common_1.UnauthorizedException('Invalid credentials');
        }
        else {
            const result = await this.requestOtp({ phone });
            return { requiresOtp: true, ...(result.devCode ? { devCode: result.devCode } : {}) };
        }
        const refreshToken = await this.tokens.createRefreshToken(user.id);
        const accessToken = await this.tokens.issueAccessToken(user);
        await this.audit.record({
            actorId: user.id,
            actorRole: user.role,
            action: 'auth.login',
            entityType: 'User',
            entityId: user.id,
            ip: input.ip,
            userAgent: input.userAgent,
        });
        return {
            user: this.sanitize(user),
            tokens: { accessToken, refreshToken: refreshToken.token, expiresIn: refreshToken.expiresInMs },
        };
    }
    async refresh(refreshToken) {
        return this.tokens.rotateRefreshToken(refreshToken);
    }
    async logout(refreshToken, userId) {
        await this.tokens.revokeRefreshToken(refreshToken);
        await this.audit.record({
            actorId: userId,
            action: 'auth.logout',
            entityType: 'User',
            entityId: userId,
        });
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { driver: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return this.sanitize(user);
    }
    sanitize(user) {
        return {
            id: user.id,
            phone: user.phone,
            email: user.email ?? null,
            name: user.name ?? null,
            role: user.role,
            isVerified: user.isVerified,
            status: user.status,
            driver: user.driver ?? null,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        otp_service_1.OtpService,
        token_service_1.TokenService,
        audit_service_1.AuditService,
        config_service_1.ConfigService])
], AuthService);
function hashPassword(password) {
    const salt = (0, crypto_1.scryptSync)('saferide', 'salt', 16).toString('hex').slice(0, 16);
    const hash = (0, crypto_1.scryptSync)(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash)
        return false;
    const candidate = (0, crypto_1.scryptSync)(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && (0, crypto_1.timingSafeEqual)(candidate, expected);
}
//# sourceMappingURL=auth.service.js.map