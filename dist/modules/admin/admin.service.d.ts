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
                rating: number | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
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
                status: import(".prisma/client").$Enums.DriverStatus;
                isVerified: boolean;
                deletedAt: Date | null;
            }) | null;
            passenger: {
                name: string | null;
                id: string;
                phone: string;
            };
        } & {
            id: string;
            createdAt: Date;
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
            state: import(".prisma/client").$Enums.RideStatus;
            offerId: string | null;
            cancelledBy: string | null;
            cancelReason: string | null;
            updatedAt: Date;
            cancelledAt: Date | null;
            completedAt: Date | null;
        })[];
    }>;
    listUsers(page: number, pageSize: number, search?: string): Promise<{
        items: {
            name: string | null;
            id: string;
            createdAt: Date;
            status: string;
            isVerified: boolean;
            _count: {
                rides: number;
                payments: number;
            };
            phone: string;
            email: string | null;
            role: import(".prisma/client").$Enums.UserRole;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    getUser(id: string): Promise<{
        driver: {
            rating: number | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
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
            status: import(".prisma/client").$Enums.DriverStatus;
            isVerified: boolean;
            deletedAt: Date | null;
        } | null;
        _count: {
            rides: number;
            disputes: number;
            payments: number;
        };
    } & {
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        isVerified: boolean;
        deletedAt: Date | null;
        phone: string;
        username: string | null;
        email: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        statusMessage: string | null;
        preferredLanguage: string | null;
        passwordHash: string | null;
        tokenVersion: number;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        emailVerifiedAt: Date | null;
    }>;
    setUserStatus(adminId: string, userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        isVerified: boolean;
        deletedAt: Date | null;
        phone: string;
        username: string | null;
        email: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        statusMessage: string | null;
        preferredLanguage: string | null;
        passwordHash: string | null;
        tokenVersion: number;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        emailVerifiedAt: Date | null;
    }>;
    listDrivers(page: number, pageSize: number, search?: string): Promise<{
        items: ({
            user: {
                name: string | null;
                id: string;
                status: string;
                phone: string;
                email: string | null;
            };
            _count: {
                rides: number;
            };
        } & {
            rating: number | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
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
            status: import(".prisma/client").$Enums.DriverStatus;
            isVerified: boolean;
            deletedAt: Date | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    getDriver(driverId: string): Promise<{
        user: {
            name: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            isVerified: boolean;
            deletedAt: Date | null;
            phone: string;
            username: string | null;
            email: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            statusMessage: string | null;
            preferredLanguage: string | null;
            passwordHash: string | null;
            tokenVersion: number;
            isPhoneVerified: boolean;
            isEmailVerified: boolean;
            emailVerifiedAt: Date | null;
        };
        payouts: {
            id: string;
            createdAt: Date;
            driverId: string;
            status: string;
            periodStart: Date;
            periodEnd: Date;
            grossAmount: number;
            commission: number;
            netAmount: number;
        }[];
        documents: {
            id: string;
            createdAt: Date;
            driverId: string;
            rejectedAt: Date | null;
            status: string;
            deletedAt: Date | null;
            type: import(".prisma/client").$Enums.DocumentType;
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
        rating: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
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
        status: import(".prisma/client").$Enums.DriverStatus;
        isVerified: boolean;
        deletedAt: Date | null;
    }>;
    approveDriver(adminId: string, driverId: string): Promise<{
        rating: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
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
        status: import(".prisma/client").$Enums.DriverStatus;
        isVerified: boolean;
        deletedAt: Date | null;
    }>;
    rejectDriver(adminId: string, driverId: string, reason?: string): Promise<{
        rating: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
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
        status: import(".prisma/client").$Enums.DriverStatus;
        isVerified: boolean;
        deletedAt: Date | null;
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
                rating: number | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
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
                status: import(".prisma/client").$Enums.DriverStatus;
                isVerified: boolean;
                deletedAt: Date | null;
            }) | null;
            payment: {
                id: string;
                createdAt: Date;
                currency: string;
                userId: string | null;
                status: import(".prisma/client").$Enums.PaymentStatus;
                rideId: string | null;
                amountCents: number;
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
            state: import(".prisma/client").$Enums.RideStatus;
            offerId: string | null;
            cancelledBy: string | null;
            cancelReason: string | null;
            updatedAt: Date;
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
            rating: number | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
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
            status: import(".prisma/client").$Enums.DriverStatus;
            isVerified: boolean;
            deletedAt: Date | null;
        }) | null;
        payment: {
            id: string;
            createdAt: Date;
            currency: string;
            userId: string | null;
            status: import(".prisma/client").$Enums.PaymentStatus;
            rideId: string | null;
            amountCents: number;
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
            id: string;
            payload: Prisma.JsonValue | null;
            createdAt: Date;
            actor: string | null;
            type: string;
            rideId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
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
        state: import(".prisma/client").$Enums.RideStatus;
        offerId: string | null;
        cancelledBy: string | null;
        cancelReason: string | null;
        updatedAt: Date;
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
            id: string;
            createdAt: Date;
            currency: string;
            userId: string | null;
            status: import(".prisma/client").$Enums.PaymentStatus;
            rideId: string | null;
            amountCents: number;
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
        id: string;
        createdAt: Date;
        currency: string;
        userId: string | null;
        status: import(".prisma/client").$Enums.PaymentStatus;
        rideId: string | null;
        amountCents: number;
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
            actorRole: string | null;
            action: string;
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
