import type { AuthUser } from '../../common/types/auth-user';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersController {
    private users;
    constructor(users: UsersService);
    me(user: AuthUser): Promise<{
        id: string;
        phone: string;
        email: string | null;
        name: string | null;
        role: string;
        isVerified: boolean;
        status: string;
        driver: {} | null;
    }>;
    updateProfile(user: AuthUser, dto: UpdateProfileDto): Promise<{
        id: string;
        phone: string;
        email: string | null;
        name: string | null;
        role: string;
        isVerified: boolean;
        status: string;
        driver: {} | null;
    }>;
    rideHistory(user: AuthUser, page?: string, pageSize?: string): Promise<{
        items: ({
            driver: ({
                user: {
                    name: string | null;
                };
            } & {
                status: import(".prisma/client").$Enums.DriverStatus;
                rating: number | null;
                id: string;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
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
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            cancelledAt: Date | null;
            completedAt: Date | null;
            passengerId: string;
            driverId: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
}
