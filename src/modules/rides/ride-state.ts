import { BadRequestException } from '@nestjs/common';
import { RideStatus } from '@prisma/client';

// Single authoritative transition table for the canonical ride lifecycle.
// Lifecycle: REQUESTED -> MATCHING -> RESERVED -> OFFERED -> EN_ROUTE_TO_PICKUP
//   -> ARRIVED_AT_PICKUP -> PICKED_UP -> EN_ROUTE_TO_DROPOFF -> COMPLETED
// Terminal states (no outgoing transitions):
//   CANCELLED | DRIVER_NO_SHOW | PASSENGER_NO_SHOW | DISPUTE | FAILED

const TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  REQUESTED: ['MATCHING', 'CANCELLED', 'FAILED'],
  MATCHING: ['RESERVED', 'CANCELLED', 'FAILED'],
  RESERVED: ['OFFERED', 'MATCHING', 'CANCELLED'],
  OFFERED: ['EN_ROUTE_TO_PICKUP', 'CANCELLED'],
  EN_ROUTE_TO_PICKUP: ['ARRIVED_AT_PICKUP', 'CANCELLED'],
  ARRIVED_AT_PICKUP: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['EN_ROUTE_TO_DROPOFF'],
  EN_ROUTE_TO_DROPOFF: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  DRIVER_NO_SHOW: [],
  PASSENGER_NO_SHOW: [],
  DISPUTE: [],
  FAILED: [],
};

// States where the passenger may cancel the ride.
export const CANCELLABLE_STATES: RideStatus[] = [
  'REQUESTED',
  'MATCHING',
  'RESERVED',
  'OFFERED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_AT_PICKUP',
];

// Non-terminal states (used for "active ride" counts / queries).
export const ACTIVE_RIDE_STATES: RideStatus[] = [
  'REQUESTED',
  'MATCHING',
  'RESERVED',
  'OFFERED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_AT_PICKUP',
  'PICKED_UP',
  'EN_ROUTE_TO_DROPOFF',
];

// States where a ride is assigned to a driver and cannot be re-dispatched.
export const ASSIGNED_ACTIVE_STATES: RideStatus[] = [
  'RESERVED',
  'OFFERED',
  'EN_ROUTE_TO_PICKUP',
  'ARRIVED_AT_PICKUP',
  'PICKED_UP',
  'EN_ROUTE_TO_DROPOFF',
];

// Only the driver may perform these transitions (forward progress of the trip).
const DRIVER_FORWARD_TRANSITIONS: Partial<Record<RideStatus, RideStatus[]>> = {
  OFFERED: ['EN_ROUTE_TO_PICKUP'],
  EN_ROUTE_TO_PICKUP: ['ARRIVED_AT_PICKUP'],
  ARRIVED_AT_PICKUP: ['PICKED_UP'],
  PICKED_UP: ['EN_ROUTE_TO_DROPOFF'],
  EN_ROUTE_TO_DROPOFF: ['COMPLETED'],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function isDriverForwardTransition(
  from: RideStatus,
  to: RideStatus,
): boolean {
  return (DRIVER_FORWARD_TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(
  from: RideStatus,
  to: RideStatus,
  context?: string,
): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `This action is not available for the current ride status.${
        context ? ` (${context})` : ''
      }`,
    );
  }
}

export function assertDriverForwardTransition(
  from: RideStatus,
  to: RideStatus,
): void {
  if (!isDriverForwardTransition(from, to)) {
    throw new BadRequestException(`This action is not available for the current ride status.`);
  }
}
