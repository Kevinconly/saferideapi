import type { AuthUser } from '../../common/types/auth-user';
import { RidesService } from './rides.service';
import { CancelRideDto, CreateRideDto, FareEstimateQueryDto } from './dto/ride.dto';
export declare class RidesController {
    private rides;
    constructor(rides: RidesService);
    request(user: AuthUser, dto: CreateRideDto): Promise<{
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
    listMine(user: AuthUser, page?: string, pageSize?: string): Promise<{
        items: ({
            driver: ({
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
    current(user: AuthUser): Promise<({
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
    }) | null>;
    fareEstimate(query: FareEstimateQueryDto): Promise<{
        distanceKm: number;
        fareCents: number;
        currency: string;
    }>;
    getOne(user: AuthUser, id: string): Promise<{
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
    cancel(user: AuthUser, id: string, dto: CancelRideDto): Promise<{
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
}
