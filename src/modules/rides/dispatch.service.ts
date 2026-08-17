import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../websocket/realtime.service';
import { retryTransaction } from '../../common/transaction';
import { ASSIGNED_ACTIVE_STATES } from './ride-state';

interface PendingOffer {
  driverId: string;
  userId: string;
  offerId: string;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger('DispatchService');
  private readonly initialDelayMs = 2000;
  private readonly offerTimeoutMs = 30000;
  private readonly maxRounds = 3;
  private readonly maxOffersPerRound = 5;
  private readonly activeRides = new Set<string>();
  private readonly pendingOffers = new Map<string, PendingOffer[]>();
  private readonly offerTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  start(rideId: string): void {
    if (this.activeRides.has(rideId)) return;
    this.activeRides.add(rideId);
    setTimeout(() => {
      void this.attemptMatch(rideId, 1).finally(() => {
        this.activeRides.delete(rideId);
      });
    }, this.initialDelayMs);
  }

  cancelOffers(rideId: string): void {
    const timer = this.offerTimers.get(rideId);
    if (timer) {
      clearTimeout(timer);
      this.offerTimers.delete(rideId);
    }
    const offers = this.pendingOffers.get(rideId);
    if (offers) {
      this.pendingOffers.delete(rideId);
      for (const offer of offers) {
        this.realtime.emitToUser(offer.userId, 'ride:offer_cancelled', {
          rideId,
          reason: 'Ride accepted by another driver',
        });
      }
    }
  }

  async tryAccept(
    rideId: string,
    driverId: string,
    offerId: string,
  ): Promise<boolean> {
    const result = await retryTransaction(() =>
      this.prisma.$transaction(async (tx) => {
        const updated = await tx.ride.updateMany({
          where: {
            id: rideId,
            state: 'MATCHING',
            driverId: null,
          },
          data: { state: 'RESERVED', driverId, offerId },
        });
        if (updated.count === 0) return false;
        await tx.rideEvent.create({
          data: {
            rideId,
            actor: 'system',
            type: 'ride.assigned',
            payload: { driverId },
          },
        });
        return true;
      }),
    );

    if (result) {
      this.cancelOffers(rideId);

      const ride = await this.prisma.ride.findUnique({
        where: { id: rideId },
        select: { passengerId: true },
      });
      if (ride) {
        this.realtime.emitToUser(ride.passengerId, 'ride:assigned', {
          rideId,
          driverId,
          state: 'RESERVED',
        });
      }
      this.logger.log(`Ride ${rideId} accepted by driver ${driverId}`);
    }
    return result;
  }

  private async attemptMatch(rideId: string, round: number): Promise<void> {
    try {
      const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
      if (!ride) return;
      if (ride.state !== 'REQUESTED' && ride.state !== 'MATCHING') return;

      const passenger = await this.prisma.user.findUnique({
        where: { id: ride.passengerId },
        select: { id: true, name: true, phone: true },
      });

      const drivers = await this.prisma.driver.findMany({
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
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { rating: 'desc' },
        take: this.maxOffersPerRound,
      });

      if (drivers.length === 0) {
        if (round < this.maxRounds) {
          setTimeout(
            () => void this.attemptMatch(rideId, round + 1),
            this.initialDelayMs,
          );
        } else {
          await this.failRide(rideId);
        }
        return;
      }

      // Transition ride to MATCHING if still REQUESTED
      if (ride.state === 'REQUESTED') {
        await this.prisma.ride.update({
          where: { id: rideId },
          data: { state: 'MATCHING' },
        });
      }

      const offers: PendingOffer[] = [];
      for (const driver of drivers) {
        const offerId = `${rideId}:${driver.id}:${round}`;
        offers.push({ driverId: driver.id, userId: driver.user.id, offerId });
      }

      this.pendingOffers.set(rideId, offers);

      for (const offer of offers) {
        const driver = drivers.find((d) => d.id === offer.driverId);
        if (!driver) continue;

        this.realtime.emitToUser(offer.userId, 'ride:offer', {
          rideId,
          offerId: offer.offerId,
          passenger: {
            name: passenger?.name ?? null,
            phone: passenger?.phone ?? 'Unknown',
          },
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
          fareCents: ride.fareCents,
          distanceKm: ride.distanceKm,
        });
      }

      this.logger.log(
        `Ride ${rideId}: sent offers to ${offers.length} drivers (round ${round})`,
      );

      const timer = setTimeout(() => {
        void this.onOfferTimeout(rideId);
      }, this.offerTimeoutMs);
      this.offerTimers.set(rideId, timer);
    } catch (err) {
      this.logger.error(`Dispatch error for ride ${rideId}`, err);
    }
  }

  private async onOfferTimeout(rideId: string): Promise<void> {
    this.offerTimers.delete(rideId);
    const offers = this.pendingOffers.get(rideId);
    if (!offers || offers.length === 0) return;

    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.state !== 'MATCHING') {
      this.pendingOffers.delete(rideId);
      return;
    }

    this.logger.log(`Ride ${rideId}: offer timed out, re-dispatching`);
    this.pendingOffers.delete(rideId);

    for (const offer of offers) {
      this.realtime.emitToUser(offer.userId, 'ride:offer_cancelled', {
        rideId,
        reason: 'Offer expired',
      });
    }

    void this.attemptMatch(rideId, 1);
  }

  private async failRide(rideId: string): Promise<void> {
    this.pendingOffers.delete(rideId);
    this.offerTimers.delete(rideId);

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
  }
}
