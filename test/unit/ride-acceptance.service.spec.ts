import { BadRequestException } from '@nestjs/common';
import { RidesService } from '../../src/modules/rides/rides.service';

const driver = { id: 'driver-1', isVerified: true, status: 'ACTIVE', userId: 'user-1' };
const acceptedRide = { id: 'ride-1', passengerId: 'passenger-1', state: 'OFFERED' };

function createService(updateCounts: number[]) {
  const tx = {
    ride: {
      updateMany: jest.fn().mockImplementation(async () => ({ count: updateCounts.shift() ?? 0 })),
      findUnique: jest.fn().mockResolvedValue(acceptedRide),
    },
    rideEvent: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    driver: { findUnique: jest.fn().mockResolvedValue(driver) },
    outbox: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (work: (client: typeof tx) => unknown) => work(tx)),
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const realtime = { emitToUser: jest.fn() };
  const dispatch = { start: jest.fn() };
  return { service: new RidesService(prisma as never, audit as never, realtime as never, dispatch as never), tx, audit };
}

describe('RidesService.acceptRide', () => {
  it('accepts only the exact reserved offer using a conditional write', async () => {
    const { service, tx } = createService([1]);

    await expect(service.acceptRide('driver-1', 'ride-1', 'offer-1')).resolves.toEqual(acceptedRide);
    expect(tx.ride.updateMany).toHaveBeenCalledWith({
      where: { id: 'ride-1', driverId: 'driver-1', state: 'RESERVED', offerId: 'offer-1' },
      data: { state: 'OFFERED' },
    });
  });

  it('leaves the ride unchanged when a competing accept has already consumed the offer', async () => {
    const { service, tx } = createService([1, 0]);

    const attempts = await Promise.allSettled([
      service.acceptRide('driver-1', 'ride-1', 'offer-1'),
      service.acceptRide('driver-1', 'ride-1', 'offer-1'),
    ]);

    expect(attempts.filter((attempt) => attempt.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === 'rejected')).toHaveLength(1);
    expect(tx.ride.updateMany).toHaveBeenCalledTimes(2);
  });

  it('rejects an expired, cancelled, or reassigned offer', async () => {
    const { service } = createService([0]);
    await expect(service.acceptRide('driver-1', 'ride-1', 'stale-offer')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
