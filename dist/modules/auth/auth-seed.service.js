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
exports.AuthSeedService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_service_1 = require("../../config/config.service");
const auth_service_1 = require("./auth.service");
let AuthSeedService = class AuthSeedService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async onModuleInit() {
        if (this.config.get('NODE_ENV') === 'production') {
            return;
        }
        try {
            if (!this.hasPrismaModels()) {
                return;
            }
            await this.seedDefaultUser({
                phone: '0785222261',
                email: 'admin@saferide.com',
                username: 'admin',
                name: 'admin',
                role: 'ADMIN',
                password: 'admin',
                isVerified: true,
            });
            await this.seedDefaultUser({
                phone: '0785222262',
                email: 'customer@saferide.com',
                username: 'customer',
                name: 'customer',
                role: 'PASSENGER',
                password: 'customer',
                isVerified: true,
            });
            await this.seedDefaultUser({
                phone: '0785222263',
                email: 'rider@saferide.com',
                username: 'rider',
                name: 'rider',
                role: 'DRIVER',
                password: 'rider',
                isVerified: true,
            });
        }
        catch (err) {
            console.warn('[AuthSeedService] skipping seeding due to error:', err?.message ?? err);
        }
    }
    hasPrismaModels() {
        return (!!this.prisma.user &&
            typeof this.prisma.user.findUnique === 'function' &&
            typeof this.prisma.user.create === 'function' &&
            typeof this.prisma.driver?.create === 'function');
    }
    async seedDefaultUser(input) {
        const phone = (0, auth_service_1.normalizePhone)(input.phone);
        const existing = await this.prisma.user.findUnique({ where: { phone } });
        if (existing) {
            const updates = {};
            if (input.username && existing.username !== input.username) {
                updates.username = input.username.toLowerCase();
            }
            if (input.email &&
                existing.email?.toLowerCase() !== input.email.toLowerCase()) {
                updates.email = input.email.toLowerCase();
            }
            if (Object.keys(updates).length) {
                await this.prisma.user.update({
                    where: { id: existing.id },
                    data: updates,
                });
            }
            return;
        }
        const user = await this.prisma.user.create({
            data: {
                phone,
                username: input.username ?? null,
                email: input.email.toLowerCase(),
                name: input.name,
                role: input.role,
                passwordHash: (0, auth_service_1.hashPassword)(input.password),
                status: 'ACTIVE',
                isVerified: input.isVerified,
                tokenVersion: 0,
            },
        });
        if (input.role === 'DRIVER') {
            await this.prisma.driver.create({
                data: {
                    userId: user.id,
                    vehicleMake: 'SafeRide',
                    vehicleModel: 'Default',
                    plateNumber: 'SR-0001',
                    rating: 5.0,
                    status: 'ACTIVE',
                    isVerified: true,
                },
            });
        }
    }
};
exports.AuthSeedService = AuthSeedService;
exports.AuthSeedService = AuthSeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_service_1.ConfigService])
], AuthSeedService);
//# sourceMappingURL=auth-seed.service.js.map