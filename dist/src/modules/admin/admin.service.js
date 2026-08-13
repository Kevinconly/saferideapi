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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const rides_service_1 = require("../rides/rides.service");
const ACTIVE_RIDE_STATES = ['REQUESTED', 'MATCHING', 'RESERVED', 'OFFERED', 'EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF'];
let AdminService = class AdminService {
    prisma;
    audit;
    rides;
    constructor(prisma, audit, rides) {
        this.prisma = prisma;
        this.audit = audit;
        this.rides = rides;
    }
    async stats() {
        const [totalUsers, totalDrivers, pendingDrivers, totalRides, activeRides, completedRides, successfulPayments] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.driver.count(),
            this.prisma.driver.count({ where: { isVerified: false } }),
            this.prisma.ride.count(),
            this.prisma.ride.count({ where: { state: { in: ACTIVE_RIDE_STATES } } }),
            this.prisma.ride.count({ where: { state: 'COMPLETED' } }),
            this.prisma.payment.findMany({
                where: { status: 'SUCCESS' },
                select: { amountCents: true },
            }),
        ]);
        const revenueCents = successfulPayments.reduce((sum, p) => sum + p.amountCents, 0);
        const recentRides = await this.prisma.ride.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                passenger: { select: { id: true, name: true, phone: true } },
                driver: { include: { user: { select: { id: true, name: true, phone: true } } } },
            },
        });
        return {
            counts: {
                users: totalUsers,
                drivers: totalDrivers,
                pendingDrivers,
                rides: totalRides,
                activeRides,
                completedRides,
            },
            revenueCents,
            recentRides,
        };
    }
    async listUsers(page, pageSize, search) {
        const where = search
            ? {
                OR: [
                    { phone: { contains: search, mode: 'insensitive' } },
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    phone: true,
                    email: true,
                    name: true,
                    role: true,
                    status: true,
                    isVerified: true,
                    createdAt: true,
                    _count: { select: { rides: true, payments: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total };
    }
    async getUser(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                driver: true,
                _count: { select: { rides: true, payments: true, disputes: true } },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async setUserStatus(adminId, userId, status) {
        const existing = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!existing)
            throw new common_1.NotFoundException('User not found');
        const user = await this.prisma.user.update({ where: { id: userId }, data: { status } });
        await this.audit.record({
            actorId: adminId,
            actorRole: 'ADMIN',
            action: `user.${status.toLowerCase()}`,
            entityType: 'user',
            entityId: userId,
            metadata: { from: existing.status, to: status },
        });
        return user;
    }
    async listDrivers(page, pageSize, search) {
        const where = search
            ? {
                OR: [
                    { plateNumber: { contains: search, mode: 'insensitive' } },
                    { vehicleModel: { contains: search, mode: 'insensitive' } },
                    { user: { phone: { contains: search, mode: 'insensitive' } } },
                ],
            }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.driver.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    user: { select: { id: true, phone: true, name: true, email: true, status: true } },
                    _count: { select: { rides: true } },
                },
            }),
            this.prisma.driver.count({ where }),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total };
    }
    async getDriver(driverId) {
        const driver = await this.prisma.driver.findUnique({
            where: { id: driverId },
            include: {
                user: true,
                documents: true,
                payouts: { orderBy: { createdAt: 'desc' }, take: 10 },
            },
        });
        if (!driver)
            throw new common_1.NotFoundException('Driver not found');
        return driver;
    }
    async approveDriver(adminId, driverId) {
        const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
        if (!driver)
            throw new common_1.NotFoundException('Driver not found');
        const updated = await this.prisma.driver.update({
            where: { id: driverId },
            data: { isVerified: true, status: 'ACTIVE' },
        });
        await this.audit.record({
            actorId: adminId,
            actorRole: 'ADMIN',
            action: 'driver.approved',
            entityType: 'driver',
            entityId: driverId,
            metadata: { userId: driver.userId },
        });
        return updated;
    }
    async rejectDriver(adminId, driverId, reason) {
        const driver = await this.prisma.driver.findUnique({ where: { id: driverId } });
        if (!driver)
            throw new common_1.NotFoundException('Driver not found');
        const updated = await this.prisma.driver.update({
            where: { id: driverId },
            data: { isVerified: false, status: 'REJECTED' },
        });
        await this.audit.record({
            actorId: adminId,
            actorRole: 'ADMIN',
            action: 'driver.rejected',
            entityType: 'driver',
            entityId: driverId,
            metadata: { userId: driver.userId, reason: reason ?? null },
        });
        return updated;
    }
    async listRides(page, pageSize, state, search) {
        const where = {};
        if (state)
            where.state = state;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { passenger: { phone: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.ride.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    passenger: { select: { id: true, name: true, phone: true } },
                    driver: { include: { user: { select: { id: true, name: true, phone: true } } } },
                    payment: true,
                },
            }),
            this.prisma.ride.count({ where }),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total };
    }
    async getRide(rideId) {
        return this.rides.getById('__admin__', rideId, 'ADMIN');
    }
    async listPayments(page, pageSize, status) {
        const where = {};
        if (status)
            where.status = status;
        const [items, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { ride: { select: { id: true, state: true, createdAt: true } } },
            }),
            this.prisma.payment.count({ where }),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total };
    }
    async refundPayment(adminId, paymentId, reason) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'REFUNDED', refundReason: reason ?? 'Refunded by admin', processedAt: new Date() },
        });
        await this.audit.record({
            actorId: adminId,
            actorRole: 'ADMIN',
            action: 'payment.refunded',
            entityType: 'payment',
            entityId: paymentId,
            metadata: { reason: reason ?? null },
        });
        return updated;
    }
    async listAuditLogs(page, pageSize, actorId, action) {
        const where = {};
        if (actorId)
            where.actorId = actorId;
        if (action)
            where.action = { contains: action };
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { actor: { select: { id: true, name: true, phone: true } } },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        rides_service_1.RidesService])
], AdminService);
//# sourceMappingURL=admin.service.js.map