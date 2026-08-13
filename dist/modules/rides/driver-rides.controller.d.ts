import type { AuthUser } from '../../common/types/auth-user';
import { RidesService } from './rides.service';
import { AcceptRideDto, RejectRideDto, UpdateRideStatusDto } from './dto/ride.dto';
export declare class DriverRidesController {
    private rides;
    constructor(rides: RidesService);
    current(user: AuthUser): Promise<({
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
    history(user: AuthUser, page?: string, pageSize?: string): Promise<{
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
    accept(user: AuthUser, id: string, dto: AcceptRideDto): Promise<{
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
    reject(user: AuthUser, id: string, dto: RejectRideDto): Promise<{
        state: string;
    }>;
    updateStatus(user: AuthUser, id: string, dto: UpdateRideStatusDto): Promise<{
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
    getOne(user: AuthUser, id: string): Promise<{
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
            id: string;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
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
    private requireDriverId;
}
