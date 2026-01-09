/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashaPeriod } from './DashaPeriod';
import type { House } from './House';
import type { Planet } from './Planet';
export type BirthChart = {
    id?: string;
    /**
     * Name of the person
     */
    name?: string;
    birthDate?: string;
    birthTime?: string;
    /**
     * Birth place name
     */
    place?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    ascendant?: Planet;
    planets?: Array<Planet>;
    houses?: Array<House>;
    dashas?: Array<DashaPeriod>;
    /**
     * Ayanamsa value in degrees
     */
    ayanamsa?: number;
    ayanamsaName?: string;
    calculatedAt?: string;
};

