"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineKm = haversineKm;
exports.isInServiceArea = isInServiceArea;
exports.computeFareCents = computeFareCents;
const KIGALI_BOUNDS = {
    minLat: -2.1,
    maxLat: -1.85,
    minLng: 29.98,
    maxLng: 30.32,
};
function haversineKm(a, b) {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}
function isInServiceArea(point) {
    return (point.lat >= KIGALI_BOUNDS.minLat &&
        point.lat <= KIGALI_BOUNDS.maxLat &&
        point.lng >= KIGALI_BOUNDS.minLng &&
        point.lng <= KIGALI_BOUNDS.maxLng);
}
const BASE_FARE_CENTS = 1000;
const PER_KM_CENTS = 450;
function computeFareCents(distanceKm) {
    return Math.round(BASE_FARE_CENTS + distanceKm * PER_KM_CENTS);
}
//# sourceMappingURL=ride.utils.js.map