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
                status: import(".prisma/client").$Enums.DriverStatus;
                id: string;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                userId: string;
                rating: number | null;
                vehicleMake: string | null;
                vehicleModel: string | null;
                plateNumber: string | null;
                licenseNumber: string | null;
                vehicleNumber: string | null;
                vehicleYear: number | null;
                insuranceProvider: string | null;
                insuranceExpiry: Date | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                suspensionReason: string | null;
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
            state: import(".prisma/client").$Enums.RideStatus;
            currency: string;
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
            phone: string;
            email: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isVerified: boolean;
            createdAt: Date;
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
            status: import(".prisma/client").$Enums.DriverStatus;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            rating: number | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
            licenseNumber: string | null;
            vehicleNumber: string | null;
            vehicleYear: number | null;
            insuranceProvider: string | null;
            insuranceExpiry: Date | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            suspensionReason: string | null;
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
        phone: string;
        username: string | null;
        email: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        statusMessage: string | null;
        preferredLanguage: string | null;
        passwordHash: string | null;
        tokenVersion: number;
        isVerified: boolean;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        emailVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    setUserStatus(adminId: string, userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{
        status: string;
        name: string | null;
        id: string;
        phone: string;
        username: string | null;
        email: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        statusMessage: string | null;
        preferredLanguage: string | null;
        passwordHash: string | null;
        tokenVersion: number;
        isVerified: boolean;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        emailVerifiedAt: Date | null;
        createdAt: Date;
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
            status: import(".prisma/client").$Enums.DriverStatus;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            rating: number | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
            licenseNumber: string | null;
            vehicleNumber: string | null;
            vehicleYear: number | null;
            insuranceProvider: string | null;
            insuranceExpiry: Date | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            suspensionReason: string | null;
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
            phone: string;
            username: string | null;
            email: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            statusMessage: string | null;
            preferredLanguage: string | null;
            passwordHash: string | null;
            tokenVersion: number;
            isVerified: boolean;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            emailVerifiedAt: Date | null;
            createdAt: Date;
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
            type: import(".prisma/client").$Enums.DocumentType;
            status: string;
            id: string;
            createdAt: Date;
            deletedAt: Date | null;
            driverId: string;
            rejectedAt: Date | null;
            url: string;
            storageKey: string | null;
            fileName: string | null;
            contentType: string | null;
            fileSize: number | null;
            verified: boolean;
            uploadedAt: Date;
            verifiedAt: Date | null;
            rejectionReason: string | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.DriverStatus;
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        rating: number | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        plateNumber: string | null;
        licenseNumber: string | null;
        vehicleNumber: string | null;
        vehicleYear: number | null;
        insuranceProvider: string | null;
        insuranceExpiry: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        suspensionReason: string | null;
    }>;
    approveDriver(adminId: string, driverId: string): Promise<{
        status: import(".prisma/client").$Enums.DriverStatus;
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        rating: number | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        plateNumber: string | null;
        licenseNumber: string | null;
        vehicleNumber: string | null;
        vehicleYear: number | null;
        insuranceProvider: string | null;
        insuranceExpiry: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        suspensionReason: string | null;
    }>;
    rejectDriver(adminId: string, driverId: string, reason?: string): Promise<{
        status: import(".prisma/client").$Enums.DriverStatus;
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        userId: string;
        rating: number | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        plateNumber: string | null;
        licenseNumber: string | null;
        vehicleNumber: string | null;
        vehicleYear: number | null;
        insuranceProvider: string | null;
        insuranceExpiry: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        suspensionReason: string | null;
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
                status: import(".prisma/client").$Enums.DriverStatus;
                id: string;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                userId: string;
                rating: number | null;
                vehicleMake: string | null;
                vehicleModel: string | null;
                plateNumber: string | null;
                licenseNumber: string | null;
                vehicleNumber: string | null;
                vehicleYear: number | null;
                insuranceProvider: string | null;
                insuranceExpiry: Date | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                suspensionReason: string | null;
            }) | null;
            payment: {
                status: import(".prisma/client").$Enums.PaymentStatus;
                id: string;
                createdAt: Date;
                rideId: string | null;
                userId: string | null;
                amountCents: number;
                currency: string;
                provider: string;
                providerReference: string | null;
                idempotencyKey: string | null;
                metadata: Prisma.JsonValue | null;
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
            state: import(".prisma/client").$Enums.RideStatus;
            currency: string;
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
            status: import(".prisma/client").$Enums.DriverStatus;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            userId: string;
            rating: number | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
            licenseNumber: string | null;
            vehicleNumber: string | null;
            vehicleYear: number | null;
            insuranceProvider: string | null;
            insuranceExpiry: Date | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            suspensionReason: string | null;
        }) | null;
        payment: {
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            createdAt: Date;
            rideId: string | null;
            userId: string | null;
            amountCents: number;
            currency: string;
            provider: string;
            providerReference: string | null;
            idempotencyKey: string | null;
            metadata: Prisma.JsonValue | null;
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
            rideId: string;
            actor: string | null;
            payload: Prisma.JsonValue | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        state: import(".prisma/client").$Enums.RideStatus;
        currency: string;
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
                state: import(".prisma/client").$Enums.RideStatus;
            } | null;
        } & {
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            createdAt: Date;
            rideId: string | null;
            userId: string | null;
            amountCents: number;
            currency: string;
            provider: string;
            providerReference: string | null;
            idempotencyKey: string | null;
            metadata: Prisma.JsonValue | null;
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
        status: import(".prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        rideId: string | null;
        userId: string | null;
        amountCents: number;
        currency: string;
        provider: string;
        providerReference: string | null;
        idempotencyKey: string | null;
        metadata: Prisma.JsonValue | null;
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
            createdAt: Date;
            metadata: Prisma.JsonValue | null;
            actorId: string | null;
            action: string;
            actorRole: string | null;
            entityType: string | null;
            entityId: string | null;
            ip: string | null;
            userAgent: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
}
