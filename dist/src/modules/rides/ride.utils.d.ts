export interface LatLng {
    lat: number;
    lng: number;
}
export declare function haversineKm(a: LatLng, b: LatLng): number;
export declare function isInServiceArea(point: LatLng): boolean;
export declare function computeFareCents(distanceKm: number): number;
