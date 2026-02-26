/**
 * @file houses.ts
 * @description House and Lagna (Ascendant) calculation module for @af/sweph-node.
 * Handles the calculation of house cusps and the ascendant, including sidereal 
 * adjustments necessary for Vedic astrology.
 */

import type { CalculationOptions, GeoLocation, LagnaInfo } from './types';
import { HouseSystem } from './types';
import {
  dateToJulian,
  getAyanamsa,
  getNativeModule,
  getRashi,
  getRashiDegree,
  initializeSweph,
  normalizeLongitude
} from './utils';

/**
 * Calculate Lagna (Ascendant) and 12 house cusps.
 * 
 * Note: Swiss Ephemeris `swe_houses` returns tropical results by default even in 
 * sidereal mode for certain configurations. This function manually subtracts 
 * the ayanamsa to ensure consistent sidereal results for Vedic astrology.
 * 
 * @param date - Date and time for calculation (local time).
 * @param location - Birth location coordinates and timezone.
 * @param options - Calculation options (ayanamsa type, house system).
 * @returns LagnaInfo object containing ascendant and 12 house cusps.
 * @throws Error if Swiss Ephemeris calculation fails.
 * @example
 * ```typescript
 * const lagna = calculateLagna(new Date(), { latitude: 27.7, longitude: 85.3 });
 * ```
 */
export function calculateLagna(
  date: Date,
  location: GeoLocation,
  options: CalculationOptions = {}
): LagnaInfo {
  initializeSweph();
  const sweph = getNativeModule();

  const { ayanamsa = 1, houseSystem = HouseSystem.PLACIDUS } = options;

  // Use the Date object's UTC moment directly. 
  // dateToJulian uses getUTC* methods which is the correct way to handle birth moments.
  const julianDay = dateToJulian(date);

  // Configure sidereal mode
  sweph.swe_set_sid_mode(ayanamsa, 0, 0);

  // Get house cusps and ascmc points from native module
  // 'houseSystem' is a single character string (e.g., 'P', 'W')
  const houseResult = sweph.swe_houses(
    julianDay,
    location.latitude,
    location.longitude,
    houseSystem
  );

  let ascendantLongitude = 0;
  let houseCusps: number[] = [];

  // Extract results based on return format (varies by native bridge version)
  if (houseResult && typeof houseResult === 'object') {
    if ('ascendant' in houseResult && typeof houseResult.ascendant === 'number') {
      ascendantLongitude = houseResult.ascendant;
    } else if (Array.isArray(houseResult.ascmc)) {
      ascendantLongitude = houseResult.ascmc[0] || 0;
    } else if (Array.isArray(houseResult.cusp)) {
      ascendantLongitude = houseResult.cusp[0] || 0;
    }

    if (Array.isArray(houseResult.house)) {
      houseCusps = houseResult.house;
    } else if (Array.isArray(houseResult.cusp)) {
      // Index 1-12 are the 12 houses
      houseCusps = houseResult.cusp.slice(1, 13);
    }
  }

  // Calculate current ayanamsa value for manual sidereal adjustment
  const ayanamsaValue = getAyanamsa(date, ayanamsa);

  // Adjust tropical longitudes to sidereal
  const siderealAscendant = normalizeLongitude(ascendantLongitude - ayanamsaValue);
  const siderealHouses = houseCusps.map(cusp => normalizeLongitude(cusp - ayanamsaValue));

  return {
    longitude: siderealAscendant,
    rasi: getRashi(siderealAscendant),
    rasiDegree: getRashiDegree(siderealAscendant),
    houses: siderealHouses.slice(0, 12),
    // Compatibility fields
    julianDay: julianDay,
  };
}

/**
 * Calculate 12 house cusps only.
 * 
 * @param date - Date and time for calculation.
 * @param location - Geographic location.
 * @param options - Calculation options.
 * @returns Array of 12 house cusp longitudes (0-360).
 */
export function calculateHouses(
  date: Date,
  location: GeoLocation,
  options: CalculationOptions = {}
): number[] {
  const lagnaInfo = calculateLagna(date, location, options);
  return lagnaInfo.houses || [];
}

/**
 * Determine which house a specific longitude occupies.
 * 
 * @param planetLongitude - Ecliptic longitude in degrees (0-360).
 * @param houses - Array of 12 house cusp longitudes.
 * @returns House number (1-12).
 * @example
 * ```typescript
 * const house = getHousePosition(120.5, houses);
 * ```
 */
export function getHousePosition(planetLongitude: number, houses: number[]): number {
  if (!houses || houses.length < 12) return 1;

  const normalizedPlanet = normalizeLongitude(planetLongitude);

  for (let i = 0; i < 12; i++) {
    const startCusp = houses[i];
    const endCusp = houses[(i + 1) % 12];

    if (startCusp === undefined || endCusp === undefined) continue;

    // Handle wrap-around situation at 360/0 degrees
    if (startCusp > endCusp) {
      if (normalizedPlanet >= startCusp || normalizedPlanet < endCusp) {
        return i + 1;
      }
    } else {
      if (normalizedPlanet >= startCusp && normalizedPlanet < endCusp) {
        return i + 1;
      }
    }
  }

  return 1;
}
