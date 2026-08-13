import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../websocket/realtime.service';
interface NotificationEventInput {
    userId: string;
    type: string;
    payload: Record<string, unknown>;
}
export declare class NotificationService {
    private prisma;
    private realtime;
    private config;
    private readonly logger;
    private pushConfigured;
    constructor(prisma: PrismaService, realtime: RealtimeService, config: ConfigService);
    registerSubscription(input: {
        userId: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        userAgent?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userAgent: string | null;
        userId: string;
        auth: string;
        endpoint: string;
        p256dh: string;
        isActive: boolean;
    }>;
    removeSubscription(userId: string, endpoint: string): Promise<{
        removed: boolean;
    }>;
    list(userId: string, page: number, pageSize: number): Promise<{
        items: {
            type: string;
            id: string;
            createdAt: Date;
            userId: string;
            title: string;
            body: string;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            priority: string;
            isRead: boolean;
            readAt: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    markRead(userId: string, notificationId: string): Promise<{
        type: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        body: string;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        priority: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAllRead(userId: string): Promise<{
        updated: number;
    }>;
    enqueueFromEvent(input: NotificationEventInput): Promise<void>;
    private sendPush;
    private render;
    private humanize;
    private formatAmount;
}
export {};
