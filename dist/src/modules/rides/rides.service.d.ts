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
                phone: string;
                id: string;
            };
        } & {
            status: string;
            userId: string;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            rating: number | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
        }) | null;
        payment: {
            status: string;
            userId: string | null;
            id: string;
            createdAt: Date;
            rideId: string | null;
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
            phone: string;
            id: string;
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
        state: string;
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
                    status: string;
                    name: string | null;
                    role: string;
                    phone: string;
                    email: string | null;
                    id: string;
                    username: string | null;
                    passwordHash: string | null;
                    tokenVersion: number;
                    isVerified: boolean;
                    emailVerifiedAt: Date | null;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                };
            } & {
                status: string;
                userId: string;
                id: string;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
                rating: number | null;
                vehicleMake: string | null;
                vehicleModel: string | null;
                plateNumber: string | null;
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
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
    getById(userId: string, rideId: string, userRole?: string): Promise<{
        driver: ({
            user: {
                name: string | null;
                phone: string;
                id: string;
            };
        } & {
            status: string;
            userId: string;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            rating: number | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
        }) | null;
        payment: {
            status: string;
            userId: string | null;
            id: string;
            createdAt: Date;
            rideId: string | null;
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
            phone: string;
            id: string;
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
        state: string;
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
    cancel(userId: string, rideId: string, reason?: string): Promise<{
        driver: ({
            user: {
                name: string | null;
                phone: string;
                id: string;
            };
        } & {
            status: string;
            userId: string;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            rating: number | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
        }) | null;
        payment: {
            status: string;
            userId: string | null;
            id: string;
            createdAt: Date;
            rideId: string | null;
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
            phone: string;
            id: string;
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
        state: string;
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
    listForDriver(driverId: string, page: number, pageSize: number): Promise<{
        items: ({
            passenger: {
                name: string | null;
                phone: string;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            state: string;
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
    currentForPassenger(userId: string): Promise<({
        driver: ({
            user: {
                name: string | null;
                phone: string;
                id: string;
            };
        } & {
            status: string;
            userId: string;
            id: string;
            isVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            rating: number | null;
            vehicleMake: string | null;
            vehicleModel: string | null;
            plateNumber: string | null;
        }) | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        state: string;
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
    currentForDriver(driverId: string): Promise<({
        passenger: {
            name: string | null;
            phone: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        state: string;
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
    acceptRide(driverId: string, rideId: string, offerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        state: string;
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
    rejectRide(driverId: string, rideId: string, offerId: string): Promise<{
        state: string;
    }>;
    updateState(driverId: string, rideId: string, newState: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        state: string;
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
    findDriverByUserId(userId: string): Promise<{
        status: string;
        userId: string;
        id: string;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        rating: number | null;
        vehicleMake: string | null;
        vehicleModel: string | null;
        plateNumber: string | null;
    } | null>;
    private isAssignedDriver;
    private notify;
}
