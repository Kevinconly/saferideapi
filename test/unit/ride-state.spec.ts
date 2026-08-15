import { BadRequestException } from '@nestjs/common';
import {
  ACTIVE_RIDE_STATES,
  ASSIGNED_ACTIVE_STATES,
  CANCELLABLE_STATES,
  assertDriverForwardTransition,
  assertTransition,
  canTransition,
  isDriverForwardTransition,
} from '../../src/modules/rides/ride-state';

describe('ride-state', () => {
  describe('canTransition', () => {
    it('follows the canonical lifecycle forward', () => {
      expect(canTransition('REQUESTED', 'MATCHING')).toBe(true);
      expect(canTransition('MATCHING', 'RESERVED')).toBe(true);
      expect(canTransition('RESERVED', 'OFFERED')).toBe(true);
      expect(canTransition('OFFERED', 'EN_ROUTE_TO_PICKUP')).toBe(true);
      expect(canTransition('EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP')).toBe(
        true,
      );
      expect(canTransition('ARRIVED_AT_PICKUP', 'PICKED_UP')).toBe(true);
      expect(canTransition('PICKED_UP', 'EN_ROUTE_TO_DROPOFF')).toBe(true);
      expect(canTransition('EN_ROUTE_TO_DROPOFF', 'COMPLETED')).toBe(true);
    });

    it('rejects skipped states', () => {
      expect(canTransition('REQUESTED', 'RESERVED')).toBe(false);
      expect(canTransition('OFFERED', 'PICKED_UP')).toBe(false);
      expect(canTransition('MATCHING', 'COMPLETED')).toBe(false);
    });

    it('rejects transitions out of terminal states', () => {
      expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
      expect(canTransition('CANCELLED', 'REQUESTED')).toBe(false);
      expect(canTransition('FAILED', 'MATCHING')).toBe(false);
      expect(canTransition('DISPUTE', 'COMPLETED')).toBe(false);
    });

    it('allows passenger cancellation from non-terminal states only', () => {
      for (const state of CANCELLABLE_STATES) {
        expect(canTransition(state, 'CANCELLED')).toBe(true);
      }
      expect(canTransition('PICKED_UP', 'CANCELLED')).toBe(false);
      expect(canTransition('EN_ROUTE_TO_DROPOFF', 'CANCELLED')).toBe(false);
    });

    it('allows driver reject to return to matching', () => {
      expect(canTransition('RESERVED', 'MATCHING')).toBe(true);
    });
  });

  describe('isDriverForwardTransition', () => {
    it('only allows the driver to advance the trip', () => {
      expect(isDriverForwardTransition('OFFERED', 'EN_ROUTE_TO_PICKUP')).toBe(
        true,
      );
      expect(
        isDriverForwardTransition('EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP'),
      ).toBe(true);
      expect(isDriverForwardTransition('ARRIVED_AT_PICKUP', 'PICKED_UP')).toBe(
        true,
      );
      expect(
        isDriverForwardTransition('PICKED_UP', 'EN_ROUTE_TO_DROPOFF'),
      ).toBe(true);
      expect(
        isDriverForwardTransition('EN_ROUTE_TO_DROPOFF', 'COMPLETED'),
      ).toBe(true);
    });

    it('rejects driver transitions outside the trip progress', () => {
      expect(isDriverForwardTransition('REQUESTED', 'MATCHING')).toBe(false);
      expect(isDriverForwardTransition('RESERVED', 'OFFERED')).toBe(false);
      expect(isDriverForwardTransition('ARRIVED_AT_PICKUP', 'CANCELLED')).toBe(
        false,
      );
    });
  });

  describe('assertTransition', () => {
    it('throws for an impossible transition', () => {
      expect(() => assertTransition('REQUESTED', 'COMPLETED')).toThrow(
        BadRequestException,
      );
    });

    it('does not throw for a valid transition', () => {
      expect(() => assertTransition('MATCHING', 'RESERVED')).not.toThrow();
    });
  });

  describe('assertDriverForwardTransition', () => {
    it('throws for a non-driver-forward transition', () => {
      expect(() =>
        assertDriverForwardTransition('RESERVED', 'OFFERED'),
      ).toThrow(BadRequestException);
    });
  });

  describe('state sets', () => {
    it('contains only canonical enum members', () => {
      expect(ACTIVE_RIDE_STATES).toEqual([
        'REQUESTED',
        'MATCHING',
        'RESERVED',
        'OFFERED',
        'EN_ROUTE_TO_PICKUP',
        'ARRIVED_AT_PICKUP',
        'PICKED_UP',
        'EN_ROUTE_TO_DROPOFF',
      ]);
      expect(ASSIGNED_ACTIVE_STATES).toEqual([
        'RESERVED',
        'OFFERED',
        'EN_ROUTE_TO_PICKUP',
        'ARRIVED_AT_PICKUP',
        'PICKED_UP',
        'EN_ROUTE_TO_DROPOFF',
      ]);
      expect(CANCELLABLE_STATES).toHaveLength(6);
    });
  });
});
