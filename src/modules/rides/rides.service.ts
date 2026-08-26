import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RideStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeService } from '../websocket/realtime.service';
import { DispatchService } from './dispatch.service';
import { retryTransaction } from '../../common/transaction';
import { computeFareCents, haversineKm, isInServiceArea } from './ride.utils';
import {
  ACTIVE_RIDE_STATES,
  ASSIGNED_ACTIVE_STATES,
  assertDriverForwardTransition,
  assertTransition,
} from './ride-state';

@Injectable()
export class RidesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private realtime: RealtimeService,
    private dispatch: DispatchService,
  ) {}

  async requestRide(
    userId: string,
    dto: {
      pickupLat: number;
      pickupLng: number;
      pickupLabel?: string;
      dropoffLat: number;
      dropoffLng: number;
      dropoffLabel?: string;
    },
  ) {
    if (!isInServiceArea({ lat: dto.pickupLat, lng: dto.pickupLng })) {
      throw new BadRequestException(
        'Pickup location is outside the Kigali service area',
      );
    }
    if (!isInServiceArea({ lat: dto.dropoffLat, lng: dto.dropoffLng })) {
      throw new BadRequestException(
        'Dropoff location is outside the Kigali service area',
      );
    }

    const existingActive = await this.prisma.ride.findFirst({
      where: { passengerId: userId, state: { in: ACTIVE_RIDE_STATES } },
    });
    if (existingActive) {
      throw new BadRequestException(
        'You already have an active ride. Please complete or cancel it first.',
      );
    }

    const distanceKm = haversineKm(
      { lat: dto.pickupLat, lng: dto.pickupLng },
      { lat: dto.dropoffLat, lng: dto.dropoffLng },
    );
    const fareCents = computeFareCents(distanceKm);

    const ride = await this.prisma.ride.create({
      data: {
        passengerId: userId,
        pickupLat: dto.pickupLat,
        pickupLng: dto.pickupLng,
        pickupLabel: dto.pickupLabel ?? null,
        dropoffLat: dto.dropoffLat,
        dropoffLng: dto.dropoffLng,
        dropoffLabel: dto.dropoffLabel ?? null,
        distanceKm,
        fareCents,
        state: 'REQUESTED',
      },
    });

    await this.prisma.rideEvent.create({
      data: {
        rideId: ride.id,
        actor: 'passenger',
        type: 'ride.requested',
        payload: { state: 'REQUESTED' },
      },
    });
    await this.audit.record({
      actorId: userId,
      actorRole: 'PASSENGER',
      action: 'ride.requested',
      entityType: 'ride',
      entityId: ride.id,
      metadata: { distanceKm, fareCents },
    });

    this.dispatch.start(ride.id);
    return this.getById(userId, ride.id);
  }

  async fareEstimate(params: {
    lat1: number;
    lng1: number;
    lat2: number;
    lng2: number;
  }) {
    const distanceKm = haversineKm(
      { lat: params.lat1, lng: params.lng1 },
      { lat: params.lat2, lng: params.lng2 },
    );
    return {
      distanceKm,
      fareCents: computeFareCents(distanceKm),
      currency: 'RWF',
    };
  }

  async listMine(userId: string, page: number, pageSize: number) {
    const where = { passengerId: userId };
    const [items, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { driver: { include: { user: true } } },
      }),
      this.prisma.ride.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    };
  }

  async getById(userId: string, rideId: string, userRole?: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
        driver: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
        events: { orderBy: { createdAt: 'asc' } },
        payment: true,
      },
    });
    if (!ride) throw new NotFoundException('Ride not found');

    const isPassenger = ride.passengerId === userId;
    const isDriver = await this.isAssignedDriver(ride.id, userId);
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isPassenger && !isDriver && !isAdmin) {
      throw new ForbiddenException('You do not have access to this ride');
    }
    return ride;
  }

  async cancel(userId: string, rideId: string, reason?: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.passengerId !== userId)
      throw new ForbiddenException('You can only cancel your own rides');

    assertTransition(ride.state, 'CANCELLED', 'passenger cancel');

    await retryTransaction(() =>
      this.prisma.$transaction(async (tx) => {
        const result = await tx.ride.update({
          where: { id: rideId },
          data: {
            state: 'CANCELLED',
            cancelledBy: userId,
            cancelReason: reason ?? null,
            cancelledAt: new Date(),
          },
        });
        await tx.rideEvent.create({
          data: {
            rideId,
            actor: 'passenger',
            type: 'ride.cancelled',
            payload: { state: 'CANCELLED', reason: reason ?? null },
          },
        });
        return result;
      }),
    );

    await this.audit.record({
      actorId: userId,
      actorRole: 'PASSENGER',
      action: 'ride.cancelled',
      entityType: 'ride',
      entityId: rideId,
      metadata: { reason: reason ?? null },
    });
    await this.notify(ride.passengerId, 'ride.cancelled', {
      rideId,
      state: 'CANCELLED',
    });
    if (ride.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: ride.driverId },
        select: { userId: true },
      });
      if (driver) {
        this.realtime.emitToUser(driver.userId, 'ride:cancelled', {
          rideId,
          state: 'CANCELLED',
        });
      }
    }
    return this.getById(userId, rideId);
  }

  // ---- Driver endpoints ----

  async listForDriver(driverId: string, page: number, pageSize: number) {
    const where = { driverId };
    const [items, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          passenger: { select: { id: true, name: true, phone: true } },
        },
      }),
      this.prisma.ride.count({ where }),
    ]);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasMore: page * pageSize < total,
    };
  }

  async currentForPassenger(userId: string) {
    return this.prisma.ride.findFirst({
      where: {
        passengerId: userId,
        state: { in: ACTIVE_RIDE_STATES },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
      },
    });
  }

  async currentForDriver(driverId: string) {
    return this.prisma.ride.findFirst({
      where: {
        driverId,
        state: { in: ASSIGNED_ACTIVE_STATES },
      },
      orderBy: { createdAt: 'desc' },
      include: { passenger: { select: { id: true, name: true, phone: true } } },
    });
  }

  async acceptRide(driverId: string, rideId: string, offerId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driverId !== driverId)
      throw new ForbiddenException('This ride is not assigned to you');
    await this.assertDriverCanOperate(driverId);
    assertTransition(ride.state, 'OFFERED', 'driver accept');
    if (ride.offerId !== offerId)
      throw new BadRequestException(
        'This offer has expired. Please check for new ride requests.',
      );

    const updated = await retryTransaction(() =>
      this.prisma.$transaction(async (tx) => {
        const result = await tx.ride.update({
          where: { id: rideId },
          data: { state: 'OFFERED' },
        });
        await tx.rideEvent.create({
          data: {
            rideId,
            actor: 'driver',
            type: 'ride.accepted',
            payload: { state: 'OFFERED', driverId },
          },
        });
        return result;
      }),
    );

    await this.audit.record({
      actorId: driverId,
      actorRole: 'DRIVER',
      action: 'ride.accepted',
      entityType: 'ride',
      entityId: rideId,
    });
    await this.notify(ride.passengerId, 'ride.status_changed', {
      rideId,
      state: 'OFFERED',
    });
    return updated;
  }

  async rejectRide(driverId: string, rideId: string, offerId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driverId !== driverId)
      throw new ForbiddenException('This ride is not assigned to you');
    await this.assertDriverCanOperate(driverId);
    assertTransition(ride.state, 'MATCHING', 'driver reject');
    if (ride.offerId !== offerId)
      throw new BadRequestException('This offer has expired');

    await retryTransaction(() =>
      this.prisma.$transaction(async (tx) => {
        await tx.ride.update({
          where: { id: rideId },
          data: { state: 'MATCHING', driverId: null, offerId: null },
        });
        await tx.rideEvent.create({
          data: {
            rideId,
            actor: 'driver',
            type: 'ride.rejected',
            payload: { driverId },
          },
        });
      }),
    );

    // Re-dispatch to another driver
    this.dispatch.start(rideId);

    // Notify the passenger that their driver was reassigned
    await this.notify(ride.passengerId, 'ride.reassigned', {
      rideId,
      state: 'MATCHING',
    });

    return { state: 'MATCHING' };
  }

  async updateState(driverId: string, rideId: string, newState: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driverId !== driverId)
      throw new ForbiddenException('This ride is not assigned to you');
    await this.assertDriverCanOperate(driverId);

    assertDriverForwardTransition(ride.state, newState as RideStatus);

    const updated = await retryTransaction(() =>
      this.prisma.$transaction(async (tx) => {
        const result = await tx.ride.update({
          where: { id: rideId },
          data: {
            state: newState as RideStatus,
            ...(newState === 'COMPLETED' ? { completedAt: new Date() } : {}),
          },
        });
        await tx.rideEvent.create({
          data: {
            rideId,
            actor: 'driver',
            type: 'ride.status_changed',
            payload: { from: ride.state, to: newState },
          },
        });
        return result;
      }),
    );

    if (newState === 'COMPLETED') {
      await this.prisma.payment.create({
        data: {
          rideId,
          userId: ride.passengerId,
          amountCents: ride.fareCents,
          provider: 'sandbox',
          providerReference: `pay_${rideId}`,
          status: 'SUCCESS',
          processedAt: new Date(),
        },
      });
      await this.notify(ride.passengerId, 'ride.completed', {
        rideId,
        state: 'COMPLETED',
      });
      await this.notify(ride.passengerId, 'payment.confirmed', {
        rideId,
        amountCents: ride.fareCents,
      });
    } else {
      await this.notify(ride.passengerId, 'ride.status_changed', {
        rideId,
        state: newState,
      });
    }

    await this.audit.record({
      actorId: driverId,
      actorRole: 'DRIVER',
      action: 'ride.status_changed',
      entityType: 'ride',
      entityId: rideId,
      metadata: { from: ride.state, to: newState },
    });
    return updated;
  }

  async findDriverByUserId(userId: string) {
    return this.prisma.driver.findUnique({ where: { userId } });
  }

  // ---- helpers ----

  private async assertDriverCanOperate(driverId: string): Promise<void> {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      select: { isVerified: true, status: true, userId: true },
    });
    if (!driver) throw new ForbiddenException('Driver profile not found');
    if (!driver.isVerified || driver.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Your driver account is not verified and active',
      );
    }
  }

  private async isAssignedDriver(
    rideId: string,
    userId: string,
  ): Promise<boolean> {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) return false;
    const ride = await this.prisma.ride.findFirst({
      where: { id: rideId, driverId: driver.id },
    });
    return !!ride;
  }

  private async notify(
    userId: string,
    type: string,
    payload: Record<string, unknown>,
  ) {
    // Web push + in-app notifications are handled by the outbox worker
    await this.prisma.outbox.create({
      data: {
        aggregateType: 'ride',
        aggregateId: typeof payload.rideId === 'string' ? payload.rideId : '',
        eventType: type,
        payload: {
          ...payload,
          userId,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    this.realtime.emitToUser(
      userId,
      `ride:${type.replace('ride.', '')}`,
      payload,
    );
  }
}
