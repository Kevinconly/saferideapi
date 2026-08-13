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
}
