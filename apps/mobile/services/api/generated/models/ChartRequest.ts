/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ChartRequest = {
    /**
     * Name of the person (optional)
     */
    name?: string;
    /**
     * Birth date in YYYY-MM-DD format
     */
    birthDate: string;
    /**
     * Birth time in HH:MM format (24-hour)
     */
    birthTime: string;
    /**
     * Birth place name (optional, for display)
     */
    place?: string;
    latitude: number;
    longitude: number;
    /**
     * IANA timezone identifier
     */
    timezone?: string;
};

