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
    listUsers(page?: string, pageSize?: string, search?: string): Promise<{
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
    setUserStatus(user: AuthUser, id: string, dto: UpdateUserStatusDto): Promise<{
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
    getDriver(id: string): Promise<{
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
    approveDriver(user: AuthUser, id: string): Promise<{
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
    rejectDriver(user: AuthUser, id: string, dto: RejectDriverDto): Promise<{
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
    listRides(page?: string, pageSize?: string, state?: string, search?: string): Promise<{
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
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
    getRide(id: string): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
            payload: import("@prisma/client/runtime/library").JsonValue | null;
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
    listPayments(page?: string, pageSize?: string, status?: string): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
            createdAt: Date;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
