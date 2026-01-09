// Vedic Astrology Types

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;

export type ZodiacSign = typeof ZODIAC_SIGNS[number];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
] as const;

export type Nakshatra = typeof NAKSHATRAS[number];

export const PLANETS = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'
] as const;

export type PlanetName = typeof PLANETS[number];

// Vimshottari Dasha sequence and periods (in years)
export const DASHA_SEQUENCE: { planet: PlanetName; years: number }[] = [
  { planet: 'Ketu', years: 7 },
  { planet: 'Venus', years: 20 },
  { planet: 'Sun', years: 6 },
  { planet: 'Moon', years: 10 },
  { planet: 'Mars', years: 7 },
  { planet: 'Rahu', years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn', years: 19 },
  { planet: 'Mercury', years: 17 },
];

export const TOTAL_DASHA_YEARS = 120;

export interface Planet {
  name: PlanetName;
  sign: ZodiacSign;
  signIndex: number;      // 0-11
  degree: number;         // 0-30 within sign
  longitude: number;      // 0-360 absolute
  nakshatra: Nakshatra;
  nakshatraPada: number;  // 1-4
  house: number;          // 1-12
  isRetrograde: boolean;
}

export interface House {
  number: number;         // 1-12
  sign: ZodiacSign;
  signIndex: number;      // 0-11
  degree: number;         // cusp degree 0-30
  longitude: number;      // 0-360 absolute
}

export interface DashaPeriod {
  planet: PlanetName;
  startDate: Date;
  endDate: Date;
  level: 'maha' | 'antar' | 'pratyantar';
}

export interface BirthChart {
  id: string;
  name?: string;           // Name of the person
  birthDate: Date;
  birthTime: string;       // HH:MM format
  place?: string;          // Birth place name
  latitude: number;
  longitude: number;
  timezone: string;

  // Calculated values
  ascendant: Planet;       // Lagna
  planets: Planet[];
  houses: House[];
  dashas: DashaPeriod[];

  // Ayanamsa used
  ayanamsa: number;
  ayanamsaName: string;

  // Metadata
  calculatedAt: Date;
}

export interface ChartRequest {
  name?: string;           // Name of the person
  birthDate: string;       // ISO date string
  birthTime: string;       // HH:MM format
  place?: string;          // Birth place name
  latitude: number;
  longitude: number;
  timezone: string;
}
