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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const web_push_1 = __importDefault(require("web-push"));
const config_service_1 = require("../../config/config.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const realtime_service_1 = require("../websocket/realtime.service");
let NotificationService = class NotificationService {
    prisma;
    realtime;
    config;
    logger = new common_1.Logger('NotificationService');
    pushConfigured = false;
    constructor(prisma, realtime, config) {
        this.prisma = prisma;
        this.realtime = realtime;
        this.config = config;
        const publicKey = config.get('VAPID_PUBLIC_KEY');
        const privateKey = config.get('VAPID_PRIVATE_KEY');
        if (publicKey && privateKey) {
            web_push_1.default.setVapidDetails(config.get('VAPID_SUBJECT'), publicKey, privateKey);
            this.pushConfigured = true;
        }
        else {
            this.logger.warn('VAPID keys not configured - web push disabled');
        }
    }
    async registerSubscription(input) {
        return this.prisma.notificationSubscription.upsert({
            where: { endpoint: input.endpoint },
            create: {
                userId: input.userId,
                endpoint: input.endpoint,
                p256dh: input.p256dh,
                auth: input.auth,
                userAgent: input.userAgent,
                isActive: true,
            },
            update: {
                userId: input.userId,
                p256dh: input.p256dh,
                auth: input.auth,
                isActive: true,
                userAgent: input.userAgent,
            },
        });
    }
    async removeSubscription(userId, endpoint) {
        await this.prisma.notificationSubscription.updateMany({
            where: { userId, endpoint },
            data: { isActive: false },
        });
        return { removed: true };
    }
    async list(userId, page, pageSize) {
        const where = { userId };
        const [items, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.notification.count({ where }),
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
    async markRead(userId, notificationId) {
        const notification = await this.prisma.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification)
            throw new common_1.NotFoundException('Notification not found');
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true, readAt: new Date() },
        });
    }
    async markAllRead(userId) {
        const res = await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        return { updated: res.count };
    }
    async enqueueFromEvent(input) {
        const template = this.render(input.type, input.payload);
        if (!template)
            return;
        const notification = await this.prisma.notification.create({
            data: {
                userId: input.userId,
                type: input.type,
                title: template.title,
                body: template.body,
                priority: template.priority,
                payload: input.payload,
            },
        });
        this.realtime.emitToUser(input.userId, 'notification:new', notification);
        void this.sendPush(input.userId, notification.id, template.title, template.body).catch((err) => this.logger.warn(`Web push failed for user ${input.userId}`, err));
    }
    async sendPush(userId, notificationId, title, body) {
        if (!this.pushConfigured)
            return;
        const subs = await this.prisma.notificationSubscription.findMany({
            where: { userId, isActive: true },
        });
        for (const sub of subs) {
            try {
                await web_push_1.default.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, JSON.stringify({
                    title,
                    body,
                    notificationId,
                    url: `/notifications`,
                }));
            }
            catch (err) {
                if (err?.statusCode === 404 || err?.statusCode === 410) {
                    await this.prisma.notificationSubscription.updateMany({
                        where: { endpoint: sub.endpoint },
                        data: { isActive: false },
                    });
                }
                else {
                    this.logger.warn(`Web push error ${err?.statusCode}`, err);
                }
            }
        }
    }
    render(type, payload) {
        switch (type) {
            case 'ride.assigned':
                return {
                    title: 'Driver assigned',
                    body: 'Your SafeRide driver is on the way to your pickup location.',
                    priority: 'HIGH',
                };
            case 'ride.status_changed':
                return {
                    title: 'Ride update',
                    body: `Your ride status is now ${this.humanize(typeof payload.state === 'string' ? payload.state : '')}.`,
                    priority: 'MEDIUM',
                };
            case 'ride.cancelled':
                return {
                    title: 'Ride cancelled',
                    body: 'Your ride has been cancelled.',
                    priority: 'HIGH',
                };
            case 'ride.completed':
                return {
                    title: 'Ride completed',
                    body: 'Your ride is complete. Thanks for riding with SafeRide!',
                    priority: 'MEDIUM',
                };
            case 'payment.confirmed':
                return {
                    title: 'Payment confirmed',
                    body: `Your payment of ${this.formatAmount(payload.amountCents)} has been confirmed.`,
                    priority: 'MEDIUM',
                };
            default:
                return {
                    title: 'SafeRide update',
                    body: 'You have a new update from SafeRide.',
                    priority: 'MEDIUM',
                };
        }
    }
    humanize(value) {
        return value.toLowerCase().replace(/_/g, ' ');
    }
    formatAmount(amountCents) {
        if (typeof amountCents !== 'number')
            return '';
        return `${(amountCents / 100).toFixed(2)} RWF`;
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_service_1.RealtimeService,
        config_service_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map