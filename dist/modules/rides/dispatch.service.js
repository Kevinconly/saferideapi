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
exports.DispatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_service_1 = require("../websocket/realtime.service");
const outbox_service_1 = require("../outbox/outbox.service");
const ACTIVE_RIDE_STATES = [
    'RESERVED',
    'EN_ROUTE_TO_PICKUP',
    'ARRIVED_AT_PICKUP',
    'PICKED_UP',
    'EN_ROUTE_TO_DROPOFF',
];
let DispatchService = class DispatchService {
    prisma;
    realtime;
    outbox;
    logger = new common_1.Logger('DispatchService');
    offerDelayMs = 2500;
    maxRounds = 3;
    constructor(prisma, realtime, outbox) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.outbox = outbox;
    }
    start(rideId) {
        setTimeout(() => void this.attemptMatch(rideId, 1), this.offerDelayMs);
    }
    async attemptMatch(rideId, round) {
        try {
            const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
            if (!ride)
                return;
            if (ride.state !== 'REQUESTED' && ride.state !== 'MATCHING')
                return;
            const driver = await this.prisma.driver.findFirst({
                where: {
                    isVerified: true,
                    status: 'ACTIVE',
                    user: { status: 'ACTIVE', role: 'DRIVER' },
                    rides: {
                        none: {
                            state: { in: ACTIVE_RIDE_STATES },
                        },
                    },
                },
                orderBy: { rating: 'desc' },
            });
            if (driver) {
                const offerId = `${rideId}:${driver.id}:${round}`;
                await this.prisma.$transaction(async (tx) => {
                    await tx.ride.update({
                        where: { id: rideId },
                        data: { state: 'RESERVED', driverId: driver.id, offerId },
                    });
                    await tx.rideEvent.create({
                        data: {
                            rideId,
                            actor: 'system',
                            type: 'ride.assigned',
                            payload: { driverId: driver.id },
                        },
                    });
                    await this.outbox.createInTx(tx, {
                        aggregateType: 'ride',
                        aggregateId: rideId,
                        eventType: 'ride.assigned',
                        payload: { rideId, driverId: driver.id, state: 'RESERVED' },
                    });
                });
                const passenger = await this.prisma.user.findUnique({
                    where: { id: ride.passengerId },
                });
                if (passenger) {
                    this.realtime.emitToUser(passenger.id, 'ride:assigned', {
                        rideId,
                        driverId: driver.id,
                        state: 'RESERVED',
                    });
                }
                this.logger.log(`Ride ${rideId} assigned to driver ${driver.id}`);
                return;
            }
            if (round < this.maxRounds) {
                setTimeout(() => void this.attemptMatch(rideId, round + 1), this.offerDelayMs);
            }
            else {
                await this.prisma.$transaction(async (tx) => {
                    await tx.ride.update({
                        where: { id: rideId },
                        data: { state: 'FAILED' },
                    });
                    await tx.rideEvent.create({
                        data: {
                            rideId,
                            actor: 'system',
                            type: 'ride.failed',
                            payload: { reason: 'NO_DRIVER' },
                        },
                    });
                });
                this.logger.warn(`Ride ${rideId} failed: no driver available`);
            }
        }
        catch (err) {
            this.logger.error(`Dispatch error for ride ${rideId}`, err);
        }
    }
};
exports.DispatchService = DispatchService;
exports.DispatchService = DispatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_service_1.RealtimeService,
        outbox_service_1.OutboxService])
], DispatchService);
//# sourceMappingURL=dispatch.service.js.map