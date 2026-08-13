"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ride_utils_1 = require("../../src/modules/rides/ride.utils");
describe('ride.utils', () => {
    describe('haversineKm', () => {
        it('returns 0 for identical points', () => {
            expect((0, ride_utils_1.haversineKm)({ lat: -1.95, lng: 30.06 }, { lat: -1.95, lng: 30.06 })).toBeCloseTo(0, 6);
        });
        it('computes a reasonable distance across Kigali (~10 km downtown to Kicukiro)', () => {
            const d = (0, ride_utils_1.haversineKm)({ lat: -1.9536, lng: 30.0606 }, { lat: -1.9878, lng: 30.1193 });
            expect(d).toBeGreaterThan(6);
            expect(d).toBeLessThan(12);
        });
    });
    describe('isInServiceArea', () => {
        it('accepts Kigali coordinates', () => {
            expect((0, ride_utils_1.isInServiceArea)({ lat: -1.95, lng: 30.06 })).toBe(true);
        });
        it('rejects coordinates far outside Kigali', () => {
            expect((0, ride_utils_1.isInServiceArea)({ lat: -2.5, lng: 29.5 })).toBe(false);
            expect((0, ride_utils_1.isInServiceArea)({ lat: 0.3, lng: 32.5 })).toBe(false);
        });
    });
    describe('computeFareCents', () => {
        it('returns base fare for zero distance', () => {
            expect((0, ride_utils_1.computeFareCents)(0)).toBeGreaterThan(0);
        });
        it('scales linearly with distance', () => {
            const a = (0, ride_utils_1.computeFareCents)(1);
            const b = (0, ride_utils_1.computeFareCents)(2);
            expect(b - a).toBeCloseTo(a - (0, ride_utils_1.computeFareCents)(0), 0);
            expect(b).toBeGreaterThan(a);
        });
    });
});
//# sourceMappingURL=ride-utils.spec.js.map