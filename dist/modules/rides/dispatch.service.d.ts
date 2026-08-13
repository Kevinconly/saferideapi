import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../websocket/realtime.service';
import { OutboxService } from '../outbox/outbox.service';
export declare class DispatchService {
    private prisma;
    private realtime;
    private outbox;
    private readonly logger;
    private readonly offerDelayMs;
    private readonly maxRounds;
    constructor(prisma: PrismaService, realtime: RealtimeService, outbox: OutboxService);
    start(rideId: string): void;
    private attemptMatch;
}
