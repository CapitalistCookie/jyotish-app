/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CachedReadingsResponse } from '../models/CachedReadingsResponse';
import type { CategoriesResponse } from '../models/CategoriesResponse';
import type { ChatRequest } from '../models/ChatRequest';
import type { ChatResponse } from '../models/ChatResponse';
import type { ReadingResponse } from '../models/ReadingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReadingService {
    /**
     * Get available reading categories
     * @returns CategoriesResponse List of available categories
     * @throws ApiError
     */
    public static getReadingCategories(): CancelablePromise<CategoriesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reading/categories',
        });
    }
    /**
     * Get AI-generated summary reading
     * @param chartId Chart ID
     * @returns ReadingResponse Summary reading generated
     * @throws ApiError
     */
    public static getSummaryReading(
        chartId: string,
    ): CancelablePromise<ReadingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reading/{chartId}/summary',
            path: {
                'chartId': chartId,
            },
            errors: {
                404: `Chart not found`,
                503: `AI service unavailable`,
            },
        });
    }
    /**
     * Get category-specific reading
     * @param chartId Chart ID
     * @param category Reading category
     * @returns ReadingResponse Reading generated
     * @throws ApiError
     */
    public static getCategoryReading(
        chartId: string,
        category: 'summary' | 'love' | 'career' | 'finances' | 'health' | 'timeline',
    ): CancelablePromise<ReadingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reading/{chartId}/{category}',
            path: {
                'chartId': chartId,
                'category': category,
            },
            errors: {
                400: `Invalid category`,
                404: `Chart not found`,
            },
        });
    }
    /**
     * Ask a follow-up question
     * @param chartId Chart ID
     * @param requestBody
     * @returns ChatResponse Question answered
     * @throws ApiError
     */
    public static askQuestion(
        chartId: string,
        requestBody: ChatRequest,
    ): CancelablePromise<ChatResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reading/{chartId}/chat',
            path: {
                'chartId': chartId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Chart not found`,
            },
        });
    }
    /**
     * Get cached readings for a chart
     * @param chartId Chart ID
     * @returns CachedReadingsResponse Cached readings list
     * @throws ApiError
     */
    public static getCachedReadings(
        chartId: string,
    ): CancelablePromise<CachedReadingsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reading/{chartId}/cached',
            path: {
                'chartId': chartId,
            },
        });
    }
}
