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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_service_1 = require("../../config/config.service");
const audit_service_1 = require("../audit/audit.service");
const outbox_service_1 = require("../outbox/outbox.service");
let PaymentsService = class PaymentsService {
    prisma;
    config;
    audit;
    outbox;
    logger = new common_1.Logger('PaymentsService');
    timers = new Set();
    constructor(prisma, config, audit, outbox) {
        this.prisma = prisma;
        this.config = config;
        this.audit = audit;
        this.outbox = outbox;
    }
    async initiateForRide(userId, rideId, idempotencyKey) {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride)
            throw new common_1.NotFoundException('Ride not found');
        if (ride.passengerId !== userId)
            throw new common_1.ForbiddenException("You cannot pay for someone else's ride");
        if (ride.state !== 'COMPLETED') {
            throw new common_1.BadRequestException('Payment is only available after the ride is completed');
        }
        const existing = await this.prisma.payment.findUnique({
            where: { rideId },
        });
        if (existing)
            return this.publicPayment(existing);
        const payment = await this.prisma.payment.create({
            data: {
                rideId,
                userId,
                amountCents: ride.fareCents,
                currency: 'RWF',
                provider: 'sandbox',
                providerReference: `pay_${rideId}`,
                idempotencyKey: idempotencyKey ?? null,
                status: 'PROCESSING',
            },
        });
        await this.audit.record({
            actorId: userId,
            actorRole: 'PASSENGER',
            action: 'payment.initiated',
            entityType: 'payment',
            entityId: payment.id,
            metadata: { rideId, amountCents: ride.fareCents },
        });
        this.scheduleAutoConfirm(payment.id);
        return this.publicPayment(payment);
    }
    async simulateSuccess(paymentId) {
        return this.confirm(paymentId, 'simulated');
    }
    async webhookSandbox(paymentId, secret) {
        const expected = this.config.get('SANDBOX_WEBHOOK_SECRET') ?? 'sandbox-secret';
        if (!secret || secret !== expected) {
            throw new common_1.ForbiddenException('Invalid webhook signature');
        }
        return this.confirm(paymentId, 'webhook');
    }
    async refund(userId, paymentId, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.userId !== userId)
            throw new common_1.ForbiddenException('You cannot refund this payment');
        if (payment.status !== 'SUCCESS') {
            throw new common_1.BadRequestException(`Only successful payments can be refunded (status: ${payment.status})`);
        }
        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'REFUNDED',
                refundReason: reason ?? null,
                processedAt: new Date(),
            },
        });
        await this.audit.record({
            actorId: userId,
            actorRole: 'PASSENGER',
            action: 'payment.refunded',
            entityType: 'payment',
            entityId: paymentId,
            metadata: { reason: reason ?? null },
        });
        return this.publicPayment(updated);
    }
    async listMine(userId, page, pageSize) {
        const where = { userId };
        const [items, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.payment.count({ where }),
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
    async getById(userId, paymentId, role) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
        if (payment.userId !== userId && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have access to this payment');
        }
        return this.publicPayment(payment);
    }
    async getByRide(userId, rideId) {
        const payment = await this.prisma.payment.findUnique({ where: { rideId } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.userId !== userId)
            throw new common_1.ForbiddenException('You do not have access to this payment');
        return this.publicPayment(payment);
    }
    async confirm(paymentId, source) {
        const existing = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Payment not found');
        if (existing.status === 'SUCCESS') {
            return this.publicPayment(existing);
        }
        if (existing.status === 'REFUNDED' || existing.status === 'FAILED') {
            throw new common_1.BadRequestException(`Payment cannot be confirmed from status ${existing.status}`);
        }
        const updated = await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'SUCCESS', processedAt: new Date() },
        });
        if (existing.userId) {
            await this.outbox.create({
                aggregateType: 'payment',
                aggregateId: paymentId,
                eventType: 'payment.confirmed',
                payload: {
                    paymentId,
                    rideId: existing.rideId ?? undefined,
                    userId: existing.userId,
                    amountCents: existing.amountCents,
                },
            });
        }
        await this.audit.record({
            actorId: null,
            actorRole: 'SYSTEM',
            action: 'payment.confirmed',
            entityType: 'payment',
            entityId: paymentId,
            metadata: { source, provider: 'sandbox' },
        });
        return this.publicPayment(updated);
    }
    scheduleAutoConfirm(paymentId) {
        const delay = this.config.get('PAYMENT_AUTO_CONFIRM_MS');
        const timer = setTimeout(() => {
            this.timers.delete(timer);
            void this.confirm(paymentId, 'auto').catch((err) => this.logger.warn(`Auto-confirm failed for payment ${paymentId}`, err));
        }, delay);
        this.timers.add(timer);
    }
    publicPayment(p) {
        return {
            id: p.id,
            amountCents: p.amountCents,
            amount: p.amountCents / 100,
            currency: p.currency,
            provider: p.provider,
            providerReference: p.providerReference,
            status: p.status,
            rideId: p.rideId,
            processedAt: p.processedAt,
            createdAt: p.createdAt,
            refundReason: p.refundReason,
        };
    }
    onModuleDestroy() {
        for (const timer of this.timers)
            clearTimeout(timer);
        this.timers.clear();
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_service_1.ConfigService,
        audit_service_1.AuditService,
        outbox_service_1.OutboxService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map