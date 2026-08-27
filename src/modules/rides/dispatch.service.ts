import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../websocket/realtime.service';
import { OutboxService } from '../outbox/outbox.service';
import { NotificationService } from '../notifications/notification.service';
import { retryTransaction } from '../../common/transaction';
import { ASSIGNED_ACTIVE_STATES } from './ride-state';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger('DispatchService');
  private readonly offerDelayMs = 2500;
  private readonly offerTimeoutMs = 10_000;
  private readonly maxRounds = 3;
  private readonly activeRides = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
    private outbox: OutboxService,
    private notifications: NotificationService,
  ) {}

  start(rideId: string): void {
    // Never run two dispatch pipelines for the same ride concurrently (a
    // reject re-dispatch can otherwise race the round timer of the previous
    // one, causing write conflicts on the shared ride row).
    if (this.activeRides.has(rideId)) return;
    this.activeRides.add(rideId);
    setTimeout(() => {
      void this.attemptMatch(rideId, 1).finally(() => {
        this.activeRides.delete(rideId);
      });
    }, this.offerDelayMs);
  }

  private async attemptMatch(rideId: string, round: number): Promise<void> {
    try {
      const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
      if (!ride) return;
      if (ride.state !== 'REQUESTED' && ride.state !== 'MATCHING') return;

      const driver = await this.prisma.driver.findFirst({
        where: {
          isVerified: true,
          isAvailable: true,
          status: 'ACTIVE',
          user: { status: 'ACTIVE', role: 'DRIVER' },
          rides: {
            none: {
              state: { in: ASSIGNED_ACTIVE_STATES },
            },
          },
        },
        orderBy: { rating: 'desc' },
      });

      if (driver) {
        const offerId = `${rideId}:${driver.id}:${round}`;
        const reserved = await retryTransaction(() =>
          this.prisma.$transaction(async (tx) => {
            // Claim the driver before reserving the ride. This prevents two
            // concurrent dispatch loops from offering different rides to the
            // same driver; the conditional update is the database authority.
            const claimedDriver = await tx.driver.updateMany({
              where: {
                id: driver.id,
                isVerified: true,
                isAvailable: true,
                status: 'ACTIVE',
              },
              data: { isAvailable: false },
            });
            if (claimedDriver.count === 0) return false;
            const updated = await tx.ride.updateMany({
              where: {
                id: rideId,
                state: { in: ['REQUESTED', 'MATCHING'] },
                driverId: null,
              },
              data: { state: 'RESERVED', driverId: driver.id, offerId },
            });
            if (updated.count === 0) {
              // Throwing rolls back the driver claim in this transaction.
              throw new Error('Ride is no longer available');
            }
            await tx.rideEvent.create({
              data: {
                rideId,
                actor: 'system',
                type: 'ride.offer_reserved',
                payload: { driverId: driver.id },
              },
            });
            await this.outbox.createInTx(tx, {
              aggregateType: 'ride',
              aggregateId: rideId,
              eventType: 'ride.offer_reserved',
              payload: { rideId, driverId: driver.id, state: 'RESERVED', passengerId: ride.passengerId },
            });
            return true;
          }),
        );
        if (!reserved) return;

        const passenger = await this.prisma.user.findUnique({
          where: { id: ride.passengerId },
        });
        const expiresAt = new Date(
          Date.now() + this.offerTimeoutMs,
        ).toISOString();
        this.realtime.emitToUser(driver.userId, 'ride:offer', {
          rideId,
          offerId,
          pickup: {
            lat: ride.pickupLat,
            lng: ride.pickupLng,
            label: ride.pickupLabel,
          },
          dropoff: {
            lat: ride.dropoffLat,
            lng: ride.dropoffLng,
            label: ride.dropoffLabel,
          },
          fareEstimate: { amountCents: ride.fareCents, currency: 'RWF' },
          passenger: passenger
            ? { name: passenger.name, phone: passenger.phone }
            : undefined,
          expiresAt,
        });
        this.logger.log(`Ride ${rideId} offered to driver ${driver.id}`);

        this.scheduleOfferTimeout(rideId, driver.userId, offerId, round);
        return;
      }

      if (round < this.maxRounds) {
        setTimeout(
          () => void this.attemptMatch(rideId, round + 1),
          this.offerDelayMs,
        );
      } else {
        await retryTransaction(() =>
          this.prisma.$transaction(async (tx) => {
            await tx.ride.update({
              where: { id: rideId },
              data: { state: 'FAILED' },
            });
            await tx.rideEvent.create({
              data: {
                rideId,
                actor: 'system',
                type: 'ride.failed',
                payload: { reason: 'NO_DRIVER' },
              },
            });
          }),
        );
        this.logger.warn(`Ride ${rideId} failed: no driver available`);

        await this.notifications.enqueueFromEvent({
          userId: ride.passengerId,
          type: 'ride.failed',
          payload: { rideId, state: 'FAILED', reason: 'NO_DRIVER' },
        });
        this.realtime.emitToUser(ride.passengerId, 'ride:failed', {
          rideId,
          state: 'FAILED',
          reason: 'NO_DRIVER',
        });
      }
    } catch (err) {
      this.logger.error(`Dispatch error for ride ${rideId}`, err);
    }
  }

  private scheduleOfferTimeout(
    rideId: string,
    driverUserId: string,
    offerId: string,
    round: number,
  ): void {
    setTimeout(async () => {
      try {
        const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
        if (!ride) return;
        if (ride.state !== 'RESERVED' || ride.offerId !== offerId) return;

        await retryTransaction(() =>
          this.prisma.$transaction(async (tx) => {
            const released = await tx.ride.updateMany({
              where: { id: rideId, state: 'RESERVED', offerId },
              data: { state: 'MATCHING', driverId: null, offerId: null },
            });
            if (released.count === 0) return;
            if (ride.driverId) {
              await tx.driver.updateMany({
                where: {
                  id: ride.driverId,
                  isVerified: true,
                  status: 'ACTIVE',
                },
                data: { isAvailable: true },
              });
            }
            await tx.rideEvent.create({
              data: {
                rideId,
                actor: 'system',
                type: 'ride.offer_expired',
                payload: { driverId: ride.driverId, offerId },
              },
            });
          }),
        );

        this.realtime.emitToUser(driverUserId, 'ride:offer_cancelled', {
          rideId,
          reason: 'Offer expired - you did not respond in time',
        });
        this.logger.log(`Ride ${rideId} offer expired for driver ${ride.driverId}`);

        this.activeRides.add(rideId);
        setTimeout(() => {
          void this.attemptMatch(rideId, round + 1).finally(() => {
            this.activeRides.delete(rideId);
          });
        }, this.offerDelayMs);
      } catch (err) {
        this.logger.error(`Offer timeout error for ride ${rideId}`, err);
      }
    }, this.offerTimeoutMs);
  }
}
