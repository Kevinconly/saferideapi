import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RidesService } from '../rides/rides.service';
export declare class AdminService {
    private prisma;
    private audit;
    private rides;
    constructor(prisma: PrismaService, audit: AuditService, rides: RidesService);
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
    listUsers(page: number, pageSize: number, search?: string): Promise<{
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
    setUserStatus(adminId: string, userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{
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
    listDrivers(page: number, pageSize: number, search?: string): Promise<{
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
    getDriver(driverId: string): Promise<{
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
    approveDriver(adminId: string, driverId: string): Promise<{
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
    rejectDriver(adminId: string, driverId: string, reason?: string): Promise<{
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
    listRides(page: number, pageSize: number, state?: string, search?: string): Promise<{
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
                metadata: Prisma.JsonValue | null;
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
    getRide(rideId: string): Promise<{
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
            metadata: Prisma.JsonValue | null;
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
            payload: Prisma.JsonValue | null;
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
    listPayments(page: number, pageSize: number, status?: string): Promise<{
        items: ({
            ride: {
                id: string;
                createdAt: Date;
                state: string;
            } | null;
        } & {
            status: string;
            id: string;
            metadata: Prisma.JsonValue | null;
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
    refundPayment(adminId: string, paymentId: string, reason?: string): Promise<{
        status: string;
        id: string;
        metadata: Prisma.JsonValue | null;
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
    listAuditLogs(page: number, pageSize: number, actorId?: string, action?: string): Promise<{
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
            metadata: Prisma.JsonValue | null;
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
