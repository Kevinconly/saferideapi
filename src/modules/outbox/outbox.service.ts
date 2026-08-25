import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

interface OutboxInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('OutboxService');
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private failures = 0;
  private readonly baseIntervalMs = 3000;
  private readonly maxIntervalMs = 60_000;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  createInTx(tx: Tx, input: OutboxInput): Promise<unknown> {
    return tx.outbox.create({
      data: {
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        payload: input.payload as any,
      },
    });
  }

  async create(input: OutboxInput): Promise<void> {
    await this.prisma.outbox.create({
      data: {
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        payload: input.payload as any,
      },
    });
  }

  onModuleInit(): void {
    this.schedule(this.baseIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(delayMs: number): void {
    this.timer = setTimeout(() => void this.tick(), delayMs);
  }

  private async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.poll();
      this.failures = 0;
      this.schedule(this.baseIntervalMs);
    } catch (err) {
      this.failures += 1;
      const backoffMs = Math.min(
        this.baseIntervalMs * 2 ** (this.failures - 1),
        this.maxIntervalMs,
      );
      if (this.failures === 1 || this.failures % 10 === 0) {
        this.logger.error(
          `Outbox poll failed (${this.failures} consecutive) - retrying in ${Math.round(backoffMs / 1000)}s`,
          err instanceof Error ? err.stack : String(err),
        );
      }
      this.schedule(backoffMs);
    } finally {
      this.running = false;
    }
  }

  private async poll(): Promise<void> {
    const batch = await this.prisma.outbox.findMany({
      where: { deliveredAt: null },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    if (!Array.isArray(batch)) {
      this.logger.error('Outbox poll returned a non-array batch', { batch });
      return;
    }

    for (const row of batch) {
      try {
        await this.process(row);
      } catch (err) {
        await this.prisma.outbox.update({
          where: { id: row.id },
          data: { attempts: { increment: 1 } },
        });
        if (row.attempts >= 4) {
          this.logger.error(`Outbox ${row.id} giving up`, String(err));
        }
      }
    }
  }

  private async process(row: {
    id: string;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payload: any;
  }): Promise<void> {
    const payload = row.payload ?? {};

    switch (row.eventType) {
      case 'ride.assigned':
      case 'ride.cancelled':
      case 'ride.completed':
      case 'ride.status_changed':
      case 'ride.reassigned':
      case 'ride.failed': {
        const userId = payload.passengerId ?? payload.userId;
        if (userId) {
          await this.notifications.enqueueFromEvent({
            userId,
            type: row.eventType,
            payload,
          });
        }
        break;
      }
      case 'payment.confirmed': {
        const userId = payload.userId;
        if (userId) {
          await this.notifications.enqueueFromEvent({
            userId,
            type: row.eventType,
            payload,
          });
        }
        break;
      }
      default:
        break;
    }

    await this.prisma.outbox.update({
      where: { id: row.id },
      data: { deliveredAt: new Date() },
    });
  }
}
