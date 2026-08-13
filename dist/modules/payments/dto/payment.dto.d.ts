export declare class InitiatePaymentDto {
    rideId: string;
    idempotencyKey?: string;
}
export declare class RefundPaymentDto {
    reason?: string;
}
export declare class SandboxWebhookDto {
    paymentId: string;
    status?: string;
}
