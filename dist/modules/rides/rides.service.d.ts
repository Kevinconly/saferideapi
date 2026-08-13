import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeService } from '../websocket/realtime.service';
import { DispatchService } from './dispatch.service';
export declare class RidesService {
    private prisma;
    private audit;
    private realtime;
    private dispatch;
    constructor(prisma: PrismaService, audit: AuditService, realtime: RealtimeService, dispatch: DispatchService);
    requestRide(userId: string, dto: {
        pickupLat: number;
        pickupLng: number;
        pickupLabel?: string;
        dropoffLat: number;
        dropoffLng: number;
        dropoffLabel?: string;
    }): Promise<{
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
    fareEstimate(params: {
        lat1: number;
        lng1: number;
        lat2: number;
        lng2: number;
    }): Promise<{
        distanceKm: number;
        fareCents: number;
        currency: string;
    }>;
    listMine(userId: string, page: number, pageSize: number): Promise<{
        items: ({
            driver: ({
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
    getById(userId: string, rideId: string, userRole?: string): Promise<{
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
    cancel(userId: string, rideId: string, reason?: string): Promise<{
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
    listForDriver(driverId: string, page: number, pageSize: number): Promise<{
        items: ({
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
    currentForPassenger(userId: string): Promise<({
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
    }) | null>;
    currentForDriver(driverId: string): Promise<({
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
    }) | null>;
    acceptRide(driverId: string, rideId: string, offerId: string): Promise<{
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
    rejectRide(driverId: string, rideId: string, offerId: string): Promise<{
        state: string;
    }>;
    updateState(driverId: string, rideId: string, newState: string): Promise<{
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
    findDriverByUserId(userId: string): Promise<{
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
    } | null>;
    private isAssignedDriver;
    private notify;
}
