export declare class CreateRideDto {
    pickupLat: number;
    pickupLng: number;
    pickupLabel?: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffLabel?: string;
}
export declare class CancelRideDto {
    reason?: string;
}
export declare class AcceptRideDto {
    offerId: string;
    idempotencyKey?: string;
}
export declare class UpdateRideStatusDto {
    newState: string;
}
export declare class RejectRideDto {
    offerId: string;
}
export declare class FareEstimateQueryDto {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
}
