import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis.service';
export declare class HealthController {
    private prisma;
    private redis;
    constructor(prisma: PrismaService, redis: RedisService);
    liveness(): {
        status: string;
    };
    readiness(): Promise<{
        status: string;
        checks: {
            db: boolean;
            redis: boolean;
        };
    }>;
    private checkDb;
}
