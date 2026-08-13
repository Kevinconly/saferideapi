import type { AuthUser } from '../../common/types/auth-user';
import { AdminService } from './admin.service';
import { AdminRefundDto, RejectDriverDto, UpdateUserStatusDto } from './dto/admin.dto';
export declare class AdminController {
    private admin;
    constructor(admin: AdminService);
    stats(): Promise<{
        counts: {
            users: number;
            drivers: number;
            pendingDrivers: number;
            rides: number;
            activeRides: number;
            completedRides: number;
        };
        revenueCents: number;
        recentRides: ({
            driver: ({
                user: {
                    name: string | null;
                    id: string;
                    phone: string;
                };
            } & {
                status: string;
                rating: number | null;
                id: string;
                createdAt: Date;
                userId: string;
                isVerified: boolean;
                updatedAt: Date;
                deletedAt: Date | null;
                vehicleMake: string | null;
                vehicleModel: string | null;
                plateNumber: string | null;
            }) | null;
            passenger: {
                name: string | null;
                id: string;
                phone: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            passengerId: string;
            driverId: string | null;
            pickupLat: number;
            pickupLng: number;
            pickupLabel: string | null;
            dropoffLat: number;
            dropoffLng: number;
            dropoffLabel: string | null;
            distanceKm: number | null;
            fareCents: number;
            currency: string;
            state: string;
            offerId: string | null;
            cancelledBy: string | null;
            cancelReason: string | null;
            cancelledAt: Date | null;
            completedAt: Date | null;
        })[];
    }>;
    listUsers(page?: string, pageSize?: string, search?: string): Promise<{
        items: {
            status: string;
            name: string | null;
            id: string;
            createdAt: Date;
            role: string;
            phone: string;
            email: string | null;
            isVerified: boolean;
            _count: {
                rides: number;
                payments: number;
            };
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    getUser(id: string): Promise<{
        driver: {
            status: string;
            rating: number | null;
            id: string;
            createdAt: Date;
            userId: string;
            isVerified: boolean;
            updatedAt: Date;
            deletedAt: Date | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
        } | null;
        _count: {
            rides: number;
            payments: number;
            disputes: number;
        };
    } & {
        status: string;
        name: string | null;
        id: string;
        createdAt: Date;
        role: string;
        phone: string;
        email: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        emailVerifiedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    setUserStatus(user: AuthUser, id: string, dto: UpdateUserStatusDto): Promise<{
        status: string;
        name: string | null;
        id: string;
        createdAt: Date;
        role: string;
        phone: string;
        email: string | null;
        passwordHash: string | null;
        isVerified: boolean;
        emailVerifiedAt: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    listDrivers(page?: string, pageSize?: string, search?: string): Promise<{
        items: ({
            user: {
                status: string;
                name: string | null;
                id: string;
                phone: string;
                email: string | null;
            };
            _count: {
                rides: number;
            };
        } & {
            status: string;
            rating: number | null;
            id: string;
            createdAt: Date;
            userId: string;
            isVerified: boolean;
            updatedAt: Date;
            deletedAt: Date | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    getDriver(id: string): Promise<{
        user: {
            status: string;
            name: string | null;
            id: string;
            createdAt: Date;
            role: string;
            phone: string;
            email: string | null;
            passwordHash: string | null;
            isVerified: boolean;
            emailVerifiedAt: Date | null;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        payouts: {
            status: string;
            id: string;
            createdAt: Date;
            driverId: string;
            periodStart: Date;
            periodEnd: Date;
            grossAmount: number;
            commission: number;
            netAmount: number;
        }[];
        documents: {
            type: string;
            status: string;
            id: string;
            createdAt: Date;
            driverId: string;
            url: string;
        }[];
    } & {
        status: string;
        rating: number | null;
        id: string;
        createdAt: Date;
        userId: string;
        isVerified: boolean;
        updatedAt: Date;
        deletedAt: Date | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        plateNumber: string | null;
    }>;
    approveDriver(user: AuthUser, id: string): Promise<{
        status: string;
        rating: number | null;
        id: string;
        createdAt: Date;
        userId: string;
        isVerified: boolean;
        updatedAt: Date;
        deletedAt: Date | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        plateNumber: string | null;
    }>;
    rejectDriver(user: AuthUser, id: string, dto: RejectDriverDto): Promise<{
        status: string;
        rating: number | null;
        id: string;
        createdAt: Date;
        userId: string;
        isVerified: boolean;
        updatedAt: Date;
        deletedAt: Date | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        plateNumber: string | null;
    }>;
    listRides(page?: string, pageSize?: string, state?: string, search?: string): Promise<{
        items: ({
            driver: ({
                user: {
                    name: string | null;
                    id: string;
                    phone: string;
                };
            } & {
                status: string;
                rating: number | null;
                id: string;
                createdAt: Date;
                userId: string;
                isVerified: boolean;
                updatedAt: Date;
                deletedAt: Date | null;
                vehicleMake: string | null;
                vehicleModel: string | null;
                plateNumber: string | null;
            }) | null;
            payment: {
                status: string;
                id: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                userId: string | null;
                currency: string;
                amountCents: number;
                rideId: string | null;
                provider: string;
                providerReference: string | null;
                idempotencyKey: string | null;
                refundReason: string | null;
                processedAt: Date | null;
            } | null;
            passenger: {
                name: string | null;
                id: string;
                phone: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            passengerId: string;
            driverId: string | null;
            pickupLat: number;
            pickupLng: number;
            pickupLabel: string | null;
            dropoffLat: number;
            dropoffLng: number;
            dropoffLabel: string | null;
            distanceKm: number | null;
            fareCents: number;
            currency: string;
            state: string;
            offerId: string | null;
            cancelledBy: string | null;
            cancelReason: string | null;
            cancelledAt: Date | null;
            completedAt: Date | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    getRide(id: string): Promise<{
        driver: ({
            user: {
                name: string | null;
                id: string;
                phone: string;
            };
        } & {
            status: string;
            rating: number | null;
            id: string;
            createdAt: Date;
            userId: string;
            isVerified: boolean;
            updatedAt: Date;
            deletedAt: Date | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
        }) | null;
        payment: {
            status: string;
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string | null;
            currency: string;
            amountCents: number;
            rideId: string | null;
            provider: string;
            providerReference: string | null;
            idempotencyKey: string | null;
            refundReason: string | null;
            processedAt: Date | null;
        } | null;
        passenger: {
            name: string | null;
            id: string;
            phone: string;
        };
        events: {
            type: string;
            id: string;
            createdAt: Date;
            actor: string | null;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            rideId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        passengerId: string;
        driverId: string | null;
        pickupLat: number;
        pickupLng: number;
        pickupLabel: string | null;
        dropoffLat: number;
        dropoffLng: number;
        dropoffLabel: string | null;
        distanceKm: number | null;
        fareCents: number;
        currency: string;
        state: string;
        offerId: string | null;
        cancelledBy: string | null;
        cancelReason: string | null;
        cancelledAt: Date | null;
        completedAt: Date | null;
    }>;
    listPayments(page?: string, pageSize?: string, status?: string): Promise<{
        items: ({
            ride: {
                id: string;
                createdAt: Date;
                state: string;
            } | null;
        } & {
            status: string;
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string | null;
            currency: string;
            amountCents: number;
            rideId: string | null;
            provider: string;
            providerReference: string | null;
            idempotencyKey: string | null;
            refundReason: string | null;
            processedAt: Date | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    refundPayment(user: AuthUser, id: string, dto: AdminRefundDto): Promise<{
        status: string;
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string | null;
        currency: string;
        amountCents: number;
        rideId: string | null;
        provider: string;
        providerReference: string | null;
        idempotencyKey: string | null;
        refundReason: string | null;
        processedAt: Date | null;
    }>;
    listAuditLogs(page?: string, pageSize?: string, actorId?: string, action?: string): Promise<{
        items: ({
            actor: {
                name: string | null;
                id: string;
                phone: string;
            } | null;
        } & {
            id: string;
            actorRole: string | null;
            action: string;
            entityType: string | null;
            entityId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            ip: string | null;
            userAgent: string | null;
            createdAt: Date;
            actorId: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
}
