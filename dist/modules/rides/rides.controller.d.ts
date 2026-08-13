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
    listMine(user: AuthUser, page?: string, pageSize?: string): Promise<{
        items: ({
            driver: ({
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
    current(user: AuthUser): Promise<({
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
    cancel(user: AuthUser, id: string, dto: CancelRideDto): Promise<{
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
}
