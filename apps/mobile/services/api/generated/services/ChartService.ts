/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BirthChart } from '../models/BirthChart';
import type { ChartRequest } from '../models/ChartRequest';
import type { ChartResponse } from '../models/ChartResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChartService {
    /**
     * Generate a birth chart
     * @param requestBody
     * @returns ChartResponse Chart generated successfully
     * @throws ApiError
     */
    public static generateChart(
        requestBody: ChartRequest,
    ): CancelablePromise<ChartResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chart/generate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid birth details`,
            },
        });
    }
    /**
     * Get a saved chart
     * @param id Chart ID
     * @returns ChartResponse Chart retrieved successfully
     * @throws ApiError
     */
    public static getChart(
        id: string,
    ): CancelablePromise<ChartResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chart/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Chart not found`,
            },
        });
    }
    /**
     * Test chart calculation
     * @returns any Test calculation successful
     * @throws ApiError
     */
    public static testCalculation(): CancelablePromise<{
        success?: boolean;
        message?: string;
        chart?: BirthChart;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chart/test/calculate',
        });
    }
}
