/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Planet = {
    name?: Planet.name;
    sign?: Planet.sign;
    signIndex?: number;
    degree?: number;
    longitude?: number;
    nakshatra?: string;
    nakshatraPada?: number;
    house?: number;
    isRetrograde?: boolean;
};
export namespace Planet {
    export enum name {
        SUN = 'Sun',
        MOON = 'Moon',
        MARS = 'Mars',
        MERCURY = 'Mercury',
        JUPITER = 'Jupiter',
        VENUS = 'Venus',
        SATURN = 'Saturn',
        RAHU = 'Rahu',
        KETU = 'Ketu',
    }
    export enum sign {
        ARIES = 'Aries',
        TAURUS = 'Taurus',
        GEMINI = 'Gemini',
        CANCER = 'Cancer',
        LEO = 'Leo',
        VIRGO = 'Virgo',
        LIBRA = 'Libra',
        SCORPIO = 'Scorpio',
        SAGITTARIUS = 'Sagittarius',
        CAPRICORN = 'Capricorn',
        AQUARIUS = 'Aquarius',
        PISCES = 'Pisces',
    }
}

