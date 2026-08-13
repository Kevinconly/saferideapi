import { Request } from 'express';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationService } from './notification.service';
import { RegisterSubscriptionDto } from './dto/notification.dto';
export declare class NotificationsController {
    private notifications;
    constructor(notifications: NotificationService);
    register(user: AuthUser, dto: RegisterSubscriptionDto, req: Request): Promise<{
        id: string;
        userAgent: string | null;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        auth: string;
        endpoint: string;
        p256dh: string;
        isActive: boolean;
    }>;
    remove(user: AuthUser, endpoint: string): Promise<{
        removed: boolean;
    }>;
    list(user: AuthUser, page?: string, pageSize?: string): Promise<{
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
    markRead(user: AuthUser, id: string): Promise<{
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
    markAllRead(user: AuthUser): Promise<{
        updated: number;
    }>;
}
