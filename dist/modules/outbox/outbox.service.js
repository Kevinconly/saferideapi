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
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_service_1 = require("../notifications/notification.service");
let OutboxService = class OutboxService {
    prisma;
    notifications;
    logger = new common_1.Logger('OutboxService');
    timer = null;
    running = false;
    failures = 0;
    baseIntervalMs = 3000;
    maxIntervalMs = 60_000;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    createInTx(tx, input) {
        return tx.outbox.create({
            data: {
                aggregateType: input.aggregateType,
                aggregateId: input.aggregateId,
                eventType: input.eventType,
                payload: input.payload,
            },
        });
    }
    async create(input) {
        await this.prisma.outbox.create({
            data: {
                aggregateType: input.aggregateType,
                aggregateId: input.aggregateId,
                eventType: input.eventType,
                payload: input.payload,
            },
        });
    }
    onModuleInit() {
        this.schedule(this.baseIntervalMs);
    }
    onModuleDestroy() {
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = null;
    }
    schedule(delayMs) {
        this.timer = setTimeout(() => void this.tick(), delayMs);
    }
    async tick() {
        if (this.running)
            return;
        this.running = true;
        try {
            await this.poll();
            this.failures = 0;
            this.schedule(this.baseIntervalMs);
        }
        catch (err) {
            this.failures += 1;
            const backoffMs = Math.min(this.baseIntervalMs * 2 ** (this.failures - 1), this.maxIntervalMs);
            if (this.failures === 1 || this.failures % 10 === 0) {
                this.logger.error(`Outbox poll failed (${this.failures} consecutive) - retrying in ${Math.round(backoffMs / 1000)}s`, err instanceof Error ? err.stack : String(err));
            }
            this.schedule(backoffMs);
        }
        finally {
            this.running = false;
        }
    }
    async poll() {
        const batch = await this.prisma.outbox.findMany({
            where: { deliveredAt: null },
            orderBy: { createdAt: 'asc' },
            take: 50,
        });
        if (!Array.isArray(batch)) {
            this.logger.error('Outbox poll returned a non-array batch', { batch });
            return;
        }
        for (const row of batch) {
            try {
                await this.process(row);
            }
            catch (err) {
                await this.prisma.outbox.update({
                    where: { id: row.id },
                    data: { attempts: { increment: 1 } },
                });
                if (row.attempts >= 4) {
                    this.logger.error(`Outbox ${row.id} giving up`, String(err));
                }
            }
        }
    }
    async process(row) {
        const payload = row.payload ?? {};
        switch (row.eventType) {
            case 'ride.assigned':
            case 'ride.cancelled':
            case 'ride.completed':
            case 'ride.status_changed': {
                const userId = payload.passengerId ?? payload.userId;
                if (userId) {
                    await this.notifications.enqueueFromEvent({
                        userId,
                        type: row.eventType,
                        payload,
                    });
                }
                break;
            }
            case 'payment.confirmed': {
                const userId = payload.userId;
                if (userId) {
                    await this.notifications.enqueueFromEvent({
                        userId,
                        type: row.eventType,
                        payload,
                    });
                }
                break;
            }
            default:
                break;
        }
        await this.prisma.outbox.update({
            where: { id: row.id },
            data: { deliveredAt: new Date() },
        });
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map