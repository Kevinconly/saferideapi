import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
export declare class OutboxService implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private notifications;
    private readonly logger;
    private timer;
    private running;
    private failures;
    private readonly baseIntervalMs;
    private readonly maxIntervalMs;
    constructor(prisma: PrismaService, notifications: NotificationService);
    createInTx(tx: Tx, input: OutboxInput): Promise<unknown>;
    create(input: OutboxInput): Promise<void>;
    onModuleInit(): void;
    onModuleDestroy(): void;
    private schedule;
    private tick;
    private poll;
    private process;
}
export {};
