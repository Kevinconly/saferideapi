import { PrismaService } from '../../prisma/prisma.service';
export interface AuditEntryInput {
    actorId?: string | null;
    actorRole?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
    ip?: string | null;
    userAgent?: string | null;
}
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    record(input: AuditEntryInput): Promise<void>;
}
