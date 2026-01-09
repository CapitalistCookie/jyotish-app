/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionStatus } from '../models/SubscriptionStatus';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SubscriptionService {
    /**
     * Get subscription status
     * @returns SubscriptionStatus Subscription status
     * @throws ApiError
     */
    public static getSubscriptionStatus(): CancelablePromise<SubscriptionStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/subscription/status',
            errors: {
                401: `Not authenticated`,
            },
        });
    }
}
