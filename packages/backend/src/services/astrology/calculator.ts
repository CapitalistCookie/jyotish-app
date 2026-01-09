import { v4 as uuidv4 } from 'uuid';
import {
  BirthChart,
  ChartRequest,
  Planet,
  PlanetName,
  House,
  DashaPeriod,
  ZodiacSign,
  Nakshatra,
  ZODIAC_SIGNS,
  NAKSHATRAS,
  PLANETS,
  DASHA_SEQUENCE,
} from './types.js';

/**
 * Calculate Julian Day from date
 */
function dateToJD(year: number, month: number, day: number, hour: number = 0): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (year + 4716)) +
             Math.floor(30.6001 * (month + 1)) +
             day + hour / 24 + B - 1524.5;
  return JD;
}

/**
 * Calculate Lahiri Ayanamsa for a given Julian Day
 */
function calculateLahiriAyanamsa(jd: number): number {
  const J1900 = 2415020.5;
  const baseAyanamsa = 23 + 51/60 + 26.5/3600;
  const precessionRate = 50.29 / 3600;
  const yearsSince1900 = (jd - J1900) / 365.25;
  return baseAyanamsa + (precessionRate * yearsSince1900);
}

/**
 * Convert tropical longitude to sidereal
 */
function toSidereal(tropicalLongitude: number, ayanamsa: number): number {
  let sidereal = tropicalLongitude - ayanamsa;
  if (sidereal < 0) sidereal += 360;
  if (sidereal >= 360) sidereal -= 360;
  return sidereal;
}

/**
 * Get zodiac sign from longitude
 */
function getSign(longitude: number): { sign: ZodiacSign; signIndex: number; degree: number } {
  const normalizedLng = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLng / 30) % 12;
  const degree = normalizedLng % 30;
  return {
    sign: ZODIAC_SIGNS[signIndex],
    signIndex,
    degree,
  };
}

/**
 * Get nakshatra from longitude
 */
function getNakshatra(longitude: number): { nakshatra: Nakshatra; pada: number } {
  const normalizedLng = ((longitude % 360) + 360) % 360;
  const nakshatraSpan = 360 / 27;
  const nakshatraIndex = Math.floor(normalizedLng / nakshatraSpan) % 27;
  const posInNakshatra = normalizedLng % nakshatraSpan;
  const pada = Math.floor(posInNakshatra / (nakshatraSpan / 4)) + 1;

  return {
    nakshatra: NAKSHATRAS[nakshatraIndex],
    pada: Math.min(pada, 4),
  };
}

/**
 * Calculate house for a planet based on Whole Sign houses
 */
function getHouse(planetLongitude: number, ascendantSignIndex: number): number {
  const planetSignIndex = Math.floor(((planetLongitude % 360) + 360) % 360 / 30) % 12;
  let house = planetSignIndex - ascendantSignIndex + 1;
  if (house <= 0) house += 12;
  return house;
}

/**
 * Normalize angle to 0-360
 */
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculate Sun position (simplified formula)
 */
function calculateSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;

  // Mean longitude
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  L0 = normalizeAngle(L0);

  // Mean anomaly
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  M = normalizeAngle(M);
  const Mrad = M * Math.PI / 180;

  // Equation of center
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
          + 0.000289 * Math.sin(3 * Mrad);

  // True longitude
  const sunLng = L0 + C;

  return normalizeAngle(sunLng);
}

/**
 * Calculate Moon position (simplified formula)
 */
function calculateMoonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;

  // Mean longitude
  let Lm = 218.3165 + 481267.8813 * T;
  Lm = normalizeAngle(Lm);

  // Mean elongation
  let D = 297.8502 + 445267.1115 * T;
  D = normalizeAngle(D);
  const Drad = D * Math.PI / 180;

  // Mean anomaly of Sun
  let Ms = 357.5291 + 35999.0503 * T;
  Ms = normalizeAngle(Ms);
  const Msrad = Ms * Math.PI / 180;

  // Mean anomaly of Moon
  let Mm = 134.9634 + 477198.8675 * T;
  Mm = normalizeAngle(Mm);
  const Mmrad = Mm * Math.PI / 180;

  // Argument of latitude
  let F = 93.2721 + 483202.0175 * T;
  F = normalizeAngle(F);
  const Frad = F * Math.PI / 180;

  // Main correction terms
  const correction =
    6.289 * Math.sin(Mmrad)
    + 1.274 * Math.sin(2 * Drad - Mmrad)
    + 0.658 * Math.sin(2 * Drad)
    + 0.214 * Math.sin(2 * Mmrad)
    - 0.186 * Math.sin(Msrad)
    - 0.114 * Math.sin(2 * Frad);

  return normalizeAngle(Lm + correction);
}

/**
 * Calculate planetary longitude using mean orbital elements
 * These are simplified formulas - accurate enough for basic charts
 */
function calculatePlanetLongitude(
  planet: PlanetName,
  jd: number
): { longitude: number; isRetrograde: boolean } {
  const T = (jd - 2451545.0) / 36525;
  let longitude = 0;
  let isRetrograde = false;

  // Orbital elements at J2000.0 and their rates
  const elements: Record<string, { L0: number; Ldot: number; period: number }> = {
    Mercury: { L0: 252.2509, Ldot: 149472.6746, period: 87.969 },
    Venus: { L0: 181.9798, Ldot: 58517.8157, period: 224.701 },
    Mars: { L0: 355.4330, Ldot: 19140.2993, period: 686.98 },
    Jupiter: { L0: 34.3515, Ldot: 3034.9057, period: 4332.59 },
    Saturn: { L0: 50.0774, Ldot: 1222.1138, period: 10759.22 },
  };

  switch (planet) {
    case 'Sun':
      longitude = calculateSunLongitude(jd);
      break;

    case 'Moon':
      longitude = calculateMoonLongitude(jd);
      break;

    case 'Mercury':
    case 'Venus':
    case 'Mars':
    case 'Jupiter':
    case 'Saturn': {
      const elem = elements[planet];
      longitude = normalizeAngle(elem.L0 + elem.Ldot * T);

      // Simple retrograde detection based on elongation from Sun
      const sunLng = calculateSunLongitude(jd);
      const elongation = Math.abs(longitude - sunLng);

      // Inner planets retrograde near inferior conjunction
      if (planet === 'Mercury' || planet === 'Venus') {
        isRetrograde = elongation < 30 || elongation > 330;
      } else {
        // Outer planets retrograde near opposition
        isRetrograde = elongation > 150 && elongation < 210;
      }
      break;
    }

    case 'Rahu': {
      // Mean North Node - moves retrograde ~19.36° per year
      const J2000 = 2451545.0;
      const daysSinceJ2000 = jd - J2000;
      const meanNodeJ2000 = 125.04;
      const dailyMotion = -0.0529539;
      longitude = normalizeAngle(meanNodeJ2000 + daysSinceJ2000 * dailyMotion);
      isRetrograde = true;
      break;
    }

    case 'Ketu': {
      // South Node - opposite to Rahu
      const J2000 = 2451545.0;
      const daysSinceJ2000 = jd - J2000;
      const meanNodeJ2000 = 125.04;
      const dailyMotion = -0.0529539;
      const rahuLng = normalizeAngle(meanNodeJ2000 + daysSinceJ2000 * dailyMotion);
      longitude = normalizeAngle(rahuLng + 180);
      isRetrograde = true;
      break;
    }
  }

  return { longitude, isRetrograde };
}

/**
 * Calculate Ascendant
 */
function calculateAscendant(
  jd: number,
  latitude: number,
  geoLongitude: number
): number {
  // Calculate Local Sidereal Time
  const T = (jd - 2451545.0) / 36525;
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
             0.000387933 * T * T - T * T * T / 38710000;
  GMST = normalizeAngle(GMST);

  // Local Sidereal Time
  const LST = normalizeAngle(GMST + geoLongitude);
  const lstRad = LST * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;

  // Obliquity of ecliptic
  const obliquity = 23.4393 - 0.0000004 * (jd - 2451545.0);
  const oblRad = obliquity * Math.PI / 180;

  // Calculate Ascendant
  const y = Math.cos(lstRad);
  const x = -(Math.sin(oblRad) * Math.tan(latRad)) - (Math.cos(oblRad) * Math.sin(lstRad));
  let ascendant = Math.atan2(y, x) * 180 / Math.PI;

  if (ascendant < 0) ascendant += 360;

  return ascendant;
}

/**
 * Calculate Vimshottari Dasha periods
 */
function calculateDashas(moonLongitude: number, birthDate: Date): DashaPeriod[] {
  const dashas: DashaPeriod[] = [];

  const { nakshatra } = getNakshatra(moonLongitude);
  const nakshatraIndex = NAKSHATRAS.indexOf(nakshatra);
  const dashaLordIndex = nakshatraIndex % 9;

  const nakshatraSpan = 360 / 27;
  const positionInNakshatra = moonLongitude % nakshatraSpan;
  const fractionElapsed = positionInNakshatra / nakshatraSpan;

  let currentDate = new Date(birthDate);
  const firstDasha = DASHA_SEQUENCE[dashaLordIndex];
  const remainingYears = firstDasha.years * (1 - fractionElapsed);

  // Add first (partial) dasha
  let endDate = new Date(currentDate);
  endDate.setFullYear(endDate.getFullYear() + Math.floor(remainingYears));
  endDate.setMonth(endDate.getMonth() + Math.floor((remainingYears % 1) * 12));

  dashas.push({
    planet: firstDasha.planet,
    startDate: new Date(currentDate),
    endDate: new Date(endDate),
    level: 'maha',
  });

  currentDate = new Date(endDate);

  // Add subsequent dashas
  for (let cycle = 0; cycle < 2; cycle++) {
    for (let i = 0; i < 9; i++) {
      const idx = (dashaLordIndex + 1 + i) % 9;
      const dasha = DASHA_SEQUENCE[idx];

      endDate = new Date(currentDate);
      endDate.setFullYear(endDate.getFullYear() + dasha.years);

      dashas.push({
        planet: dasha.planet,
        startDate: new Date(currentDate),
        endDate: new Date(endDate),
        level: 'maha',
      });

      currentDate = new Date(endDate);
    }
  }

  return dashas;
}

/**
 * Main function to calculate a complete birth chart
 */
export function calculateChart(request: ChartRequest): BirthChart {
  const [year, month, day] = request.birthDate.split('-').map(Number);
  const [hours, minutes] = request.birthTime.split(':').map(Number);

  const birthDate = new Date(year, month - 1, day, hours, minutes);
  const jd = dateToJD(year, month, day, hours + minutes / 60);

  // Calculate ayanamsa
  const ayanamsa = calculateLahiriAyanamsa(jd);

  // Calculate Ascendant (tropical then convert to sidereal)
  const tropicalAsc = calculateAscendant(jd, request.latitude, request.longitude);
  const siderealAsc = toSidereal(tropicalAsc, ayanamsa);
  const ascSignInfo = getSign(siderealAsc);
  const ascNakshatra = getNakshatra(siderealAsc);

  const ascendant: Planet = {
    name: 'Sun', // Placeholder for Lagna
    sign: ascSignInfo.sign,
    signIndex: ascSignInfo.signIndex,
    degree: ascSignInfo.degree,
    longitude: siderealAsc,
    nakshatra: ascNakshatra.nakshatra,
    nakshatraPada: ascNakshatra.pada,
    house: 1,
    isRetrograde: false,
  };

  // Calculate all planet positions
  const planets: Planet[] = [];

  for (const planetName of PLANETS) {
    const { longitude: tropicalLng, isRetrograde } = calculatePlanetLongitude(planetName, jd);
    const siderealLng = toSidereal(tropicalLng, ayanamsa);
    const signInfo = getSign(siderealLng);
    const nakshatraInfo = getNakshatra(siderealLng);
    const house = getHouse(siderealLng, ascSignInfo.signIndex);

    planets.push({
      name: planetName,
      sign: signInfo.sign,
      signIndex: signInfo.signIndex,
      degree: signInfo.degree,
      longitude: siderealLng,
      nakshatra: nakshatraInfo.nakshatra,
      nakshatraPada: nakshatraInfo.pada,
      house,
      isRetrograde,
    });
  }

  // Calculate houses (Whole Sign system)
  const houses: House[] = [];
  for (let i = 0; i < 12; i++) {
    const houseSignIndex = (ascSignInfo.signIndex + i) % 12;
    const houseLng = houseSignIndex * 30;

    houses.push({
      number: i + 1,
      sign: ZODIAC_SIGNS[houseSignIndex],
      signIndex: houseSignIndex,
      degree: 0,
      longitude: houseLng,
    });
  }

  // Calculate Vimshottari Dasha
  const moonPlanet = planets.find(p => p.name === 'Moon')!;
  const dashas = calculateDashas(moonPlanet.longitude, birthDate);

  return {
    id: uuidv4(),
    birthDate,
    birthTime: request.birthTime,
    latitude: request.latitude,
    longitude: request.longitude,
    timezone: request.timezone,
    ascendant,
    planets,
    houses,
    dashas: dashas.slice(0, 20),
    ayanamsa,
    ayanamsaName: 'Lahiri',
    calculatedAt: new Date(),
  };
}

/**
 * Test function
 */
export function testCalculation(): BirthChart {
  return calculateChart({
    birthDate: '2000-01-01',
    birthTime: '12:00',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
  });
}
