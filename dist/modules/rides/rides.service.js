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
exports.RidesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const realtime_service_1 = require("../websocket/realtime.service");
const dispatch_service_1 = require("./dispatch.service");
const ride_utils_1 = require("./ride.utils");
const FORWARD_TRANSITIONS = {
    OFFERED: ['EN_ROUTE_TO_PICKUP'],
    EN_ROUTE_TO_PICKUP: ['ARRIVED_AT_PICKUP'],
    ARRIVED_AT_PICKUP: ['PICKED_UP'],
    PICKED_UP: ['EN_ROUTE_TO_DROPOFF'],
    EN_ROUTE_TO_DROPOFF: ['COMPLETED'],
};
let RidesService = class RidesService {
    prisma;
    audit;
    realtime;
    dispatch;
    constructor(prisma, audit, realtime, dispatch) {
        this.prisma = prisma;
        this.audit = audit;
        this.realtime = realtime;
        this.dispatch = dispatch;
    }
    async requestRide(userId, dto) {
        if (!(0, ride_utils_1.isInServiceArea)({ lat: dto.pickupLat, lng: dto.pickupLng })) {
            throw new common_1.BadRequestException('Pickup location is outside the Kigali service area');
        }
        if (!(0, ride_utils_1.isInServiceArea)({ lat: dto.dropoffLat, lng: dto.dropoffLng })) {
            throw new common_1.BadRequestException('Dropoff location is outside the Kigali service area');
        }
        const distanceKm = (0, ride_utils_1.haversineKm)({ lat: dto.pickupLat, lng: dto.pickupLng }, { lat: dto.dropoffLat, lng: dto.dropoffLng });
        const fareCents = (0, ride_utils_1.computeFareCents)(distanceKm);
        const ride = await this.prisma.ride.create({
            data: {
                passengerId: userId,
                pickupLat: dto.pickupLat,
                pickupLng: dto.pickupLng,
                pickupLabel: dto.pickupLabel ?? null,
                dropoffLat: dto.dropoffLat,
                dropoffLng: dto.dropoffLng,
                dropoffLabel: dto.dropoffLabel ?? null,
                distanceKm,
                fareCents,
                state: 'REQUESTED',
            },
        });
        await this.prisma.rideEvent.create({
            data: {
                rideId: ride.id,
                actor: 'passenger',
                type: 'ride.requested',
                payload: { state: 'REQUESTED' },
            },
        });
        await this.audit.record({
            actorId: userId,
            actorRole: 'PASSENGER',
            action: 'ride.requested',
            entityType: 'ride',
            entityId: ride.id,
            metadata: { distanceKm, fareCents },
        });
        this.dispatch.start(ride.id);
        return this.getById(userId, ride.id);
    }
    async fareEstimate(params) {
        const distanceKm = (0, ride_utils_1.haversineKm)({ lat: params.lat1, lng: params.lng1 }, { lat: params.lat2, lng: params.lng2 });
        return {
            distanceKm,
            fareCents: (0, ride_utils_1.computeFareCents)(distanceKm),
            currency: 'RWF',
        };
    }
    async listMine(userId, page, pageSize) {
        const where = { passengerId: userId };
        const [items, total] = await Promise.all([
            this.prisma.ride.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { driver: { include: { user: true } } },
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
    async getById(userId, rideId, userRole) {
        const ride = await this.prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                passenger: { select: { id: true, name: true, phone: true } },
                driver: {
                    include: { user: { select: { id: true, name: true, phone: true } } },
                },
                events: { orderBy: { createdAt: 'asc' } },
                payment: true,
            },
        });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        const isPassenger = ride.passengerId === userId;
        const isDriver = await this.isAssignedDriver(ride.id, userId);
        const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        if (!isPassenger && !isDriver && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have access to this ride');
        }
        return ride;
    }
    async cancel(userId, rideId, reason) {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (ride.passengerId !== userId)
            throw new common_1.ForbiddenException('You can only cancel your own rides');
        const cancellable = [
            'REQUESTED',
            'MATCHING',
            'RESERVED',
            'OFFERED',
            'EN_ROUTE_TO_PICKUP',
            'ARRIVED_AT_PICKUP',
        ];
        if (!cancellable.includes(ride.state)) {
            throw new common_1.BadRequestException(`Ride cannot be cancelled in state ${ride.state}`);
        }
        await this.prisma.$transaction(async (tx) => {
            const result = await tx.ride.update({
                where: { id: rideId },
                data: {
                    state: 'CANCELLED',
                    cancelledBy: userId,
                    cancelReason: reason ?? null,
                    cancelledAt: new Date(),
                },
            });
            await tx.rideEvent.create({
                data: {
                    rideId,
                    actor: 'passenger',
                    type: 'ride.cancelled',
                    payload: { state: 'CANCELLED', reason: reason ?? null },
                },
            });
            return result;
        });
        await this.audit.record({
            actorId: userId,
            actorRole: 'PASSENGER',
            action: 'ride.cancelled',
            entityType: 'ride',
            entityId: rideId,
            metadata: { reason: reason ?? null },
        });
        await this.notify(ride.passengerId, 'ride.cancelled', {
            rideId,
            state: 'CANCELLED',
        });
        if (ride.driverId) {
            this.realtime.emitToUser(ride.driverId, 'ride:cancelled', {
                rideId,
                state: 'CANCELLED',
            });
        }
        return this.getById(userId, rideId);
    }
    async listForDriver(driverId, page, pageSize) {
        const where = { driverId };
        const [items, total] = await Promise.all([
            this.prisma.ride.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    passenger: { select: { id: true, name: true, phone: true } },
                },
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
    async currentForPassenger(userId) {
        return this.prisma.ride.findFirst({
            where: {
                passengerId: userId,
                state: {
                    in: [
                        'REQUESTED',
                        'MATCHING',
                        'RESERVED',
                        'OFFERED',
                        'EN_ROUTE_TO_PICKUP',
                        'ARRIVED_AT_PICKUP',
                        'PICKED_UP',
                        'EN_ROUTE_TO_DROPOFF',
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                driver: {
                    include: { user: { select: { id: true, name: true, phone: true } } },
                },
            },
        });
    }
    async currentForDriver(driverId) {
        return this.prisma.ride.findFirst({
            where: {
                driverId,
                state: {
                    in: [
                        'RESERVED',
                        'OFFERED',
                        'EN_ROUTE_TO_PICKUP',
                        'ARRIVED_AT_PICKUP',
                        'PICKED_UP',
                        'EN_ROUTE_TO_DROPOFF',
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
            include: { passenger: { select: { id: true, name: true, phone: true } } },
        });
    }
    async acceptRide(driverId, rideId, offerId) {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (ride.driverId !== driverId)
            throw new common_1.ForbiddenException('This ride is not assigned to you');
        if (ride.state !== 'RESERVED')
            throw new common_1.BadRequestException(`Ride is not awaiting acceptance (state: ${ride.state})`);
        if (ride.offerId !== offerId)
            throw new common_1.BadRequestException('Offer ID does not match - the offer may have expired');
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.ride.update({
                where: { id: rideId },
                data: { state: 'OFFERED' },
            });
            await tx.rideEvent.create({
                data: {
                    rideId,
                    actor: 'driver',
                    type: 'ride.accepted',
                    payload: { state: 'OFFERED', driverId },
                },
            });
            return result;
        });
        await this.audit.record({
            actorId: driverId,
            actorRole: 'DRIVER',
            action: 'ride.accepted',
            entityType: 'ride',
            entityId: rideId,
        });
        await this.notify(ride.passengerId, 'ride.status_changed', {
            rideId,
            state: 'OFFERED',
        });
        return updated;
    }
    async rejectRide(driverId, rideId, offerId) {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (ride.driverId !== driverId)
            throw new common_1.ForbiddenException('This ride is not assigned to you');
        if (ride.state !== 'RESERVED')
            throw new common_1.BadRequestException(`Ride is not awaiting your response (state: ${ride.state})`);
        if (ride.offerId !== offerId)
            throw new common_1.BadRequestException('Offer ID does not match');
        await this.prisma.$transaction(async (tx) => {
            await tx.ride.update({
                where: { id: rideId },
                data: { state: 'MATCHING', driverId: null, offerId: null },
            });
            await tx.rideEvent.create({
                data: {
                    rideId,
                    actor: 'driver',
                    type: 'ride.rejected',
                    payload: { driverId },
                },
            });
        });
        this.dispatch.start(rideId);
        return { state: 'MATCHING' };
    }
    async updateState(driverId, rideId, newState) {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (ride.driverId !== driverId)
            throw new common_1.ForbiddenException('This ride is not assigned to you');
        const allowed = FORWARD_TRANSITIONS[ride.state];
        if (!allowed || !allowed.includes(newState)) {
            throw new common_1.BadRequestException(`Invalid transition ${ride.state} -> ${newState}`);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const result = await tx.ride.update({
                where: { id: rideId },
                data: {
                    state: newState,
                    ...(newState === 'COMPLETED' ? { completedAt: new Date() } : {}),
                },
            });
            await tx.rideEvent.create({
                data: {
                    rideId,
                    actor: 'driver',
                    type: 'ride.status_changed',
                    payload: { from: ride.state, to: newState },
                },
            });
            return result;
        });
        if (newState === 'COMPLETED') {
            await this.prisma.payment.create({
                data: {
                    rideId,
                    userId: ride.passengerId,
                    amountCents: ride.fareCents,
                    provider: 'sandbox',
                    providerReference: `pay_${rideId}`,
                    status: 'SUCCESS',
                    processedAt: new Date(),
                },
            });
            await this.notify(ride.passengerId, 'ride.completed', {
                rideId,
                state: 'COMPLETED',
            });
            await this.notify(ride.passengerId, 'payment.confirmed', {
                rideId,
                amountCents: ride.fareCents,
            });
        }
        else {
            await this.notify(ride.passengerId, 'ride.status_changed', {
                rideId,
                state: newState,
            });
        }
        await this.audit.record({
            actorId: driverId,
            actorRole: 'DRIVER',
            action: 'ride.status_changed',
            entityType: 'ride',
            entityId: rideId,
            metadata: { from: ride.state, to: newState },
        });
        return updated;
    }
    async findDriverByUserId(userId) {
        return this.prisma.driver.findUnique({ where: { userId } });
    }
    async isAssignedDriver(rideId, userId) {
        const driver = await this.prisma.driver.findUnique({ where: { userId } });
        if (!driver)
            return false;
        const ride = await this.prisma.ride.findFirst({
            where: { id: rideId, driverId: driver.id },
        });
        return !!ride;
    }
    async notify(userId, type, payload) {
        await this.prisma.outbox.create({
            data: {
                aggregateType: 'ride',
                aggregateId: typeof payload.rideId === 'string' ? payload.rideId : '',
                eventType: type,
                payload: payload,
            },
        });
        this.realtime.emitToUser(userId, `ride:${type.replace('ride.', '')}`, payload);
    }
};
exports.RidesService = RidesService;
exports.RidesService = RidesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        realtime_service_1.RealtimeService,
        dispatch_service_1.DispatchService])
], RidesService);
//# sourceMappingURL=rides.service.js.map