import { Request } from 'express';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationService } from './notification.service';
import { RegisterSubscriptionDto } from './dto/notification.dto';
export declare class NotificationsController {
    private notifications;
    constructor(notifications: NotificationService);
    register(user: AuthUser, dto: RegisterSubscriptionDto, req: Request): Promise<{
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userAgent: string | null;
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
            userId: string;
            id: string;
            createdAt: Date;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            title: string;
            body: string;
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
        userId: string;
        id: string;
        createdAt: Date;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
        title: string;
        body: string;
        priority: string;
        isRead: boolean;
        readAt: Date | null;
    }>;
    markAllRead(user: AuthUser): Promise<{
        updated: number;
    }>;
}
