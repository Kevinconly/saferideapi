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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const app_error_1 = require("../../common/exceptions/app-error");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { driver: true },
        });
        if (!user)
            throw app_error_1.Errors.notFound('User not found');
        return this.sanitize(user);
    }
    async updateProfile(userId, data) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!existing)
            throw app_error_1.Errors.notFound('User not found');
        if (data.email && data.email !== existing.email) {
            const taken = await this.prisma.user.findFirst({
                where: { email: data.email },
            });
            if (taken && taken.id !== userId) {
                throw app_error_1.Errors.conflict('Email already in use');
            }
        }
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { name: data.name, email: data.email },
        });
        return this.sanitize(user);
    }
    async getRideHistory(userId, page, pageSize) {
        const where = { passengerId: userId };
        const [items, total] = await Promise.all([
            this.prisma.ride.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { driver: { include: { user: { select: { name: true } } } } },
            }),
            this.prisma.ride.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            hasMore: page * pageSize < total,
        };
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
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map