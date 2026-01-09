/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SubscriptionStatus = {
    success?: boolean;
    subscription?: {
        plan?: SubscriptionStatus.plan;
        status?: SubscriptionStatus.status;
        expiresAt?: string | null;
        features?: Array<string>;
    };
};
export namespace SubscriptionStatus {
    export enum plan {
        FREE = 'free',
        PREMIUM = 'premium',
        PRO = 'pro',
    }
    export enum status {
        ACTIVE = 'active',
        CANCELLED = 'cancelled',
        EXPIRED = 'expired',
    }
}

