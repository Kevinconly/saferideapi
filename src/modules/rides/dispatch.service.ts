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
            const updated = await tx.ride.updateMany({
              where: {
                id: rideId,
                state: { in: ['REQUESTED', 'MATCHING'] },
                driverId: null,
              },
              data: { state: 'RESERVED', driverId: driver.id, offerId },
            });
            if (updated.count === 0) return false;
            await tx.rideEvent.create({
              data: {
                rideId,
                actor: 'system',
                type: 'ride.assigned',
                payload: { driverId: driver.id },
              },
            });
            await this.outbox.createInTx(tx, {
              aggregateType: 'ride',
              aggregateId: rideId,
              eventType: 'ride.assigned',
              payload: { rideId, driverId: driver.id, state: 'RESERVED' },
            });
            return true;
          }),
        );
        if (!reserved) return;

        const passenger = await this.prisma.user.findUnique({
          where: { id: ride.passengerId },
        });
        if (passenger) {
          this.realtime.emitToUser(passenger.id, 'ride:assigned', {
            rideId,
            driverId: driver.id,
            state: 'RESERVED',
          });
        }
        this.logger.log(`Ride ${rideId} assigned to driver ${driver.id}`);
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
}
