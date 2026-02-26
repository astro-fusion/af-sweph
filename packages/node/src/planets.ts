/**
 * @file planets.ts
 * @description Planetary calculation module for @af/sweph-node.
 * Handles calculation of celestial body positions, rise/set times, 
 * and specific Vedic astrological parameters like combustion and retrograde motion.
 */

import { CALC_FLAGS, OUTER_PLANETS, VEDIC_PLANET_ORDER } from './constants';
import type { CalculationOptions, GeoLocation, Planet } from './types';
import {
  callAzAlt,
  callRiseTrans,
  dateToJulian,
  getNativeModule,
  getRashi,
  getRashiDegree,
  initializeSweph,
  isRetrograde,
  julianToDate,
  normalizeLongitude
} from './utils';

/**
 * Internal interface for celestial body position data.
 */
interface CelestialPosition {
  longitude: number;
  latitude: number;
  distance: number;
}

/**
 * Calculate azimuth and altitude for a celestial body.
 * @param julianDay - Julian day number.
 * @param location - Geographic location for calculation.
 * @param planetPos - Planet position in ecliptic coordinates.
 * @returns Object containing azimuth (degrees from North) and altitude (degrees above horizon).
 * @internal
 */
function calculateAzAlt(
  julianDay: number,
  location: GeoLocation,
  planetPos: CelestialPosition
): { azimuth: number; altitude: number } {
  const result = callAzAlt(julianDay, location, planetPos);

  return {
    azimuth: result.azimuth || result[0] || 0,
    altitude: result.altitude || result[1] || 0
  };
}

/**
 * Check if a planet is combust (too close to the Sun to be visible).
 * Based on standard Vedic astrology combustion limits.
 * 
 * @param planetName - Canonical name of the planet.
 * @param planetLongitude - Planet's ecliptic longitude in degrees.
 * @param sunLongitude - Sun's ecliptic longitude in degrees.
 * @returns true if planet is combust, false otherwise.
 * @internal
 */
function checkCombustion(planetName: string, planetLongitude: number, sunLongitude: number): boolean {
  if (planetName === 'Sun' || planetName === 'Rahu' || planetName === 'Ketu') return false;

  let difference = Math.abs(planetLongitude - sunLongitude);
  if (difference > 180) difference = 360 - difference;

  const limits: Record<string, number> = {
    'Moon': 12,
    'Mars': 17,
    'Mercury': 14,
    'Jupiter': 11,
    'Venus': 10,
    'Saturn': 15
  };

  const limit = limits[planetName] || 10;
  return difference <= limit;
}

/**
 * Calculate positions for all 9 Vedic planets (Navagraha).
 * Includes Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu.
 * 
 * @param date - Date and time for calculation (local time).
 * @param options - Calculation options including ayanamsa, house system, and location.
 * @returns Array of planet positions with Vedic astrology details.
 * @throws Error if Swiss Ephemeris initialization or calculation fails.
 * @example
 * ```typescript
 * const planets = calculatePlanets(new Date(), { ayanamsa: 1 });
 * ```
 */
export function calculatePlanets(
  date: Date,
  options: CalculationOptions = {}
): Planet[] {
  initializeSweph();
  const sweph = getNativeModule();

  const { ayanamsa = 1, includeSpeed = true, location } = options;

  // Set sidereal mode
  sweph.swe_set_sid_mode(ayanamsa, 0, 0);

  const julianDay = dateToJulian(date);
  const resultPlanets: Planet[] = [];

  let calculationFlags = CALC_FLAGS.SIDEREAL | CALC_FLAGS.SWIEPH;
  if (includeSpeed) calculationFlags |= CALC_FLAGS.SPEED;

  let rahuLongitude: number | null = null;
  let rahuSpeed: number | null = null;
  let sunLongitude: number | null = null;

  const calculatedData: any[] = [];

  const planetsToCalculate = [...VEDIC_PLANET_ORDER];
  if (options.includeOuterPlanets) {
    planetsToCalculate.push(...OUTER_PLANETS);
  }

  for (const planetDef of planetsToCalculate) {
    // Ketu is derived from Rahu later
    if (planetDef.name === 'Ketu') continue;

    const result = sweph.swe_calc_ut(julianDay, planetDef.id, calculationFlags);

    if (result && typeof result === 'object') {
      let longitude = 0;
      let latitude = 0;
      let distance = 0;
      let speed = 0;

      if (Array.isArray(result)) {
        longitude = result[0] || 0;
        latitude = result[1] || 0;
        distance = result[2] || 0;
        speed = result[3] || 0;
      } else if (result.xx && Array.isArray(result.xx)) {
        longitude = result.xx[0] || 0;
        latitude = result.xx[1] || 0;
        distance = result.xx[2] || 0;
        speed = result.xx[3] || 0;
      } else if ('longitude' in result) {
        longitude = result.longitude;
        latitude = result.latitude || 0;
        distance = result.distance || 0;
        speed = result.longitudeSpeed || result.speed || 0;
      }

      const normalizedLong = normalizeLongitude(longitude);

      if (planetDef.name === 'Sun') {
        sunLongitude = normalizedLong;
      }

      if (planetDef.name === 'Rahu') {
        rahuLongitude = normalizedLong;
        rahuSpeed = speed;
      }

      calculatedData.push({
        def: planetDef,
        longitude: normalizedLong,
        latitude,
        distance,
        speed
      });
    }
  }

  // Map calculated data to final Planet structure
  for (const item of calculatedData) {
    let azAlt = {};
    if (location) {
      azAlt = calculateAzAlt(julianDay, location, {
        longitude: item.longitude,
        latitude: item.latitude,
        distance: item.distance
      });
    }

    const isCombust = sunLongitude !== null
      ? checkCombustion(item.def.name, item.longitude, sunLongitude)
      : false;

    resultPlanets.push({
      id: item.def.name.toLowerCase(),
      name: item.def.name,
      longitude: item.longitude,
      latitude: item.latitude,
      distance: item.distance,
      speed: item.speed,
      rasi: getRashi(item.longitude),
      rasiDegree: getRashiDegree(item.longitude),
      isRetrograde: isRetrograde(item.speed),
      totalDegree: item.longitude,
      ...azAlt,
      isCombust
    });
  }

  // Manually add Ketu (always 180° opposite to Rahu)
  if (rahuLongitude !== null) {
    const ketuLongitude = normalizeLongitude(rahuLongitude + 180);
    const ketuSpeed = rahuSpeed !== null ? rahuSpeed : 0; // Rahu/Ketu speeds are same

    let azAlt = {};
    if (location) {
      azAlt = calculateAzAlt(julianDay, location, {
        longitude: ketuLongitude,
        latitude: 0,
        distance: 0
      });
    }

    resultPlanets.push({
      id: 'ketu',
      name: 'Ketu',
      longitude: ketuLongitude,
      latitude: 0,
      distance: 0,
      speed: ketuSpeed,
      rasi: getRashi(ketuLongitude),
      rasiDegree: getRashiDegree(ketuLongitude),
      isRetrograde: isRetrograde(ketuSpeed),
      totalDegree: ketuLongitude,
      ...azAlt,
      isCombust: false
    });
  }

  return resultPlanets;
}

/**
 * Calculate position for a single planet or celestial body.
 * 
 * @param planetId - Swiss Ephemeris planet ID (0=Sun, 1=Moon, etc.).
 * @param date - Date and time for calculation (local time).
 * @param options - Calculation options including ayanamsa and location.
 * @returns Planet position object or null if calculation fails.
 * @throws Error if Swiss Ephemeris is not initialized.
 * @example
 * ```typescript
 * const moon = calculateSinglePlanet(1, new Date(), { ayanamsa: 1 });
 * ```
 */
export function calculateSinglePlanet(
  planetId: number,
  date: Date,
  options: CalculationOptions = {}
): Planet | null {
  initializeSweph();
  const sweph = getNativeModule();

  const { ayanamsa = 1, includeSpeed = true, location } = options;

  sweph.swe_set_sid_mode(ayanamsa, 0, 0);

  const julianDay = dateToJulian(date);

  let calculationFlags = CALC_FLAGS.SIDEREAL | CALC_FLAGS.SWIEPH;
  if (includeSpeed) calculationFlags |= CALC_FLAGS.SPEED;

  const result = sweph.swe_calc_ut(julianDay, planetId, calculationFlags);

  if (!result || typeof result !== 'object') {
    return null;
  }

  let longitude = 0;
  let latitude = 0;
  let distance = 0;
  let speed = 0;

  if (Array.isArray(result)) {
    longitude = result[0] || 0;
    latitude = result[1] || 0;
    distance = result[2] || 0;
    speed = result[3] || 0;
  } else if (result.xx && Array.isArray(result.xx)) {
    longitude = result.xx[0] || 0;
    latitude = result.xx[1] || 0;
    distance = result.xx[2] || 0;
    speed = result.xx[3] || 0;
  }

  const normalizedLongitude = normalizeLongitude(longitude);

  // Resolve planet name
  const planetNameResult = sweph.swe_get_planet_name(planetId);
  const planetName = (typeof planetNameResult === 'object' && planetNameResult?.name)
    ? planetNameResult.name
    : (typeof planetNameResult === 'string' ? planetNameResult : `Planet ${planetId}`);

  let azAlt = {};
  if (location) {
    azAlt = calculateAzAlt(julianDay, location, {
      longitude: normalizedLongitude,
      latitude,
      distance
    });
  }

  return {
    id: planetId.toString(),
    name: planetName,
    longitude: normalizedLongitude,
    latitude,
    distance,
    speed,
    rasi: getRashi(normalizedLongitude),
    rasiDegree: getRashiDegree(normalizedLongitude),
    isRetrograde: isRetrograde(speed),
    totalDegree: normalizedLongitude,
    ...azAlt
  };
}

/**
 * Calculate rise, set, and transit times for a celestial body.
 * 
 * @param planetId - Swiss Ephemeris planet ID (0=Sun, 1=Moon, etc.).
 * @param date - Date for calculation (local time).
 * @param location - Geographic location for calculation.
 * @returns Object containing rise, set, and transit times.
 * @example
 * ```typescript
 * const times = calculatePlanetRiseSetTimes(0, new Date(), location);
 * ```
 */
export function calculatePlanetRiseSetTimes(
  planetId: number,
  date: Date,
  location: GeoLocation
): { rise: Date | null; set: Date | null; transit: Date | null; transitAltitude: number; transitDistance: number } {
  initializeSweph();
  const sweph = getNativeModule();

  const timezone = location.timezone ?? 0;
  const julianDay = dateToJulian(date);

  const CALC_RISE = sweph.SE_CALC_RISE || 1;
  const CALC_SET = sweph.SE_CALC_SET || 2;
  const CALC_TRANSIT = sweph.SE_CALC_MTRANSIT || 4;

  const riseResult = callRiseTrans(julianDay, planetId, CALC_RISE, location);
  const setResult = callRiseTrans(julianDay, planetId, CALC_SET, location);
  const transitResult = callRiseTrans(julianDay, planetId, CALC_TRANSIT, location);

  const rise = riseResult?.transitTime ? julianToDate(riseResult.transitTime, timezone) : null;
  const set = setResult?.transitTime ? julianToDate(setResult.transitTime, timezone) : null;
  const transit = transitResult?.transitTime ? julianToDate(transitResult.transitTime, timezone) : null;

  return {
    rise,
    set,
    transit,
    transitAltitude: 0,
    transitDistance: 0
  };
}
