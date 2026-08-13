import type { AuthUser } from '../../common/types/auth-user';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, RefundPaymentDto, SandboxWebhookDto } from './dto/payment.dto';
export declare class PaymentsController {
    private payments;
    constructor(payments: PaymentsService);
    initiate(user: AuthUser, dto: InitiatePaymentDto): Promise<{
        id: string;
        amountCents: number;
        amount: number;
        currency: string;
        provider: string;
        providerReference: string | null;
        status: string;
        rideId: string | null;
        processedAt: Date | null;
        createdAt: Date;
        refundReason: string | null;
    }>;
    simulateSuccess(user: AuthUser, id: string): Promise<{
        id: string;
        amountCents: number;
        amount: number;
        currency: string;
        provider: string;
        providerReference: string | null;
        status: string;
        rideId: string | null;
        processedAt: Date | null;
        createdAt: Date;
        refundReason: string | null;
    }>;
    refund(user: AuthUser, id: string, dto: RefundPaymentDto): Promise<{
        id: string;
        amountCents: number;
        amount: number;
        currency: string;
        provider: string;
        providerReference: string | null;
        status: string;
        rideId: string | null;
        processedAt: Date | null;
        createdAt: Date;
        refundReason: string | null;
    }>;
    list(user: AuthUser, page?: string, pageSize?: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            currency: string;
            userId: string | null;
            status: import(".prisma/client").$Enums.PaymentStatus;
            rideId: string | null;
            amountCents: number;
            provider: string;
            providerReference: string | null;
            idempotencyKey: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            refundReason: string | null;
            processedAt: Date | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        hasMore: boolean;
    }>;
    byRide(user: AuthUser, rideId: string): Promise<{
        id: string;
        amountCents: number;
        amount: number;
        currency: string;
        provider: string;
        providerReference: string | null;
        status: string;
        rideId: string | null;
        processedAt: Date | null;
        createdAt: Date;
        refundReason: string | null;
    }>;
    getOne(user: AuthUser, id: string): Promise<{
        id: string;
        amountCents: number;
        amount: number;
        currency: string;
        provider: string;
        providerReference: string | null;
        status: string;
        rideId: string | null;
        processedAt: Date | null;
        createdAt: Date;
        refundReason: string | null;
    }>;
    webhookSandbox(dto: SandboxWebhookDto, secret: string): Promise<{
        id: string;
        amountCents: number;
        amount: number;
        currency: string;
        provider: string;
        providerReference: string | null;
        status: string;
        rideId: string | null;
        processedAt: Date | null;
        createdAt: Date;
        refundReason: string | null;
    }>;
}
