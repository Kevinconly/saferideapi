import { Injectable, Logger } from '@nestjs/common'
import { DriverStatus, RideStatus, UserRole } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import { OutboxService } from '../outbox/outbox.service'
import { RealtimeService } from '../websocket/realtime.service'

const ACTIVE_RIDE_STATES: RideStatus[] = [
  RideStatus.PENDING_ACCEPTANCE,
  RideStatus.ACCEPTED,
  RideStatus.DRIVER_EN_ROUTE,
  RideStatus.ARRIVED,
  RideStatus.PASSENGER_ON_BOARD,
  RideStatus.IN_PROGRESS,
]

@Injectable()
export class DispatchService {
  private readonly logger = new Logger('DispatchService')
  private readonly offerDelayMs = 2500
  private readonly maxRounds = 3

  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
    private outbox: OutboxService,
  ) {}

  start(rideId: string): void {
    setTimeout(() => void this.attemptMatch(rideId, 1), this.offerDelayMs)
  }

  private async attemptMatch(rideId: string, round: number): Promise<void> {
    try {
      const ride = await this.prisma.ride.findUnique({ where: { id: rideId } })
      if (!ride) return
      if (ride.state !== RideStatus.REQUESTED) return

      const driver = await this.prisma.driver.findFirst({
        where: {
          isVerified: true,
          status: DriverStatus.ACTIVE,
          user: { status: 'ACTIVE', role: UserRole.DRIVER },
          rides: {
            none: {
              state: { in: ACTIVE_RIDE_STATES },
            },
          },
        },
        orderBy: { rating: 'desc' },
      })

      if (driver) {
        const offerId = `${rideId}:${driver.id}:${round}`
        await this.prisma.$transaction(async (tx) => {
          await tx.ride.update({
            where: { id: rideId },
            data: { state: RideStatus.PENDING_ACCEPTANCE, driverId: driver.id, offerId },
          })
          await tx.rideEvent.create({
            data: {
              rideId,
              actor: 'system',
              type: 'ride.assigned',
              payload: { driverId: driver.id },
            },
          })
          await this.outbox.createInTx(tx, {
            aggregateType: 'ride',
            aggregateId: rideId,
            eventType: 'ride.assigned',
            payload: { rideId, driverId: driver.id, state: RideStatus.PENDING_ACCEPTANCE },
          })
        })

        const passenger = await this.prisma.user.findUnique({ where: { id: ride.passengerId } })
        if (passenger) {
          await this.realtime.emitToUser(passenger.id, 'ride:assigned', {
            rideId,
            driverId: driver.id,
            state: RideStatus.PENDING_ACCEPTANCE,
          })
        }
        this.logger.log(`Ride ${rideId} assigned to driver ${driver.id}`)
        return
      }

      if (round < this.maxRounds) {
        setTimeout(() => void this.attemptMatch(rideId, round + 1), this.offerDelayMs)
      } else {
        await this.prisma.$transaction(async (tx) => {
          await tx.ride.update({ where: { id: rideId }, data: { state: RideStatus.FAILED } })
          await tx.rideEvent.create({
            data: { rideId, actor: 'system', type: 'ride.failed', payload: { reason: 'NO_DRIVER' } },
          })
        })
        this.logger.warn(`Ride ${rideId} failed: no driver available`)
      }
    } catch (err) {
      this.logger.error(`Dispatch error for ride ${rideId}`, err as any)
    }
  }
}
