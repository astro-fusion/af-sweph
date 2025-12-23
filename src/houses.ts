/**
 * House and Lagna Calculations for @AstroFusion/sweph
 */

import type { LagnaInfo, GeoLocation, CalculationOptions } from './types';
import { HouseSystem } from './types';
import { 
  initializeSweph, 
  getNativeModule, 
  dateToJulian, 
  getAyanamsa,
  normalizeLongitude,
  getRashi,
  getRashiDegree
} from './utils';

/**
 * Calculate Lagna (Ascendant) and house cusps
 * @param date - Date and time for calculation
 * @param location - Geographic location
 * @param options - Calculation options
 * @returns Lagna and house information
 */
export function calculateLagna(
  date: Date,
  location: GeoLocation,
  options: CalculationOptions = {}
): LagnaInfo {
  initializeSweph();
  const sweph = getNativeModule();
  
  const { ayanamsa = 1, houseSystem = HouseSystem.PLACIDUS } = options;
  const timezone = location.timezone ?? 0;
  
  // Convert to UTC
  const utcTime = new Date(date.getTime() - timezone * 60 * 60 * 1000);
  const jd = dateToJulian(utcTime);
  
  // Set sidereal mode
  sweph.swe_set_sid_mode(ayanamsa, 0, 0);
  
  // Calculate houses
  const houseResult = sweph.swe_houses(
    jd,
    location.latitude,
    location.longitude,
    houseSystem
  );
  
  let ascendant = 0;
  let houses: number[] = [];
  
  // Extract ascendant from result
  if ('ascendant' in houseResult && typeof houseResult.ascendant === 'number') {
    ascendant = houseResult.ascendant;
  } else if (Array.isArray(houseResult.cusp)) {
    ascendant = houseResult.cusp[0] || 0;
  }
  
  // Extract house cusps
  if (Array.isArray(houseResult.house)) {
    houses = houseResult.house;
  } else if (Array.isArray(houseResult.cusp)) {
    houses = houseResult.cusp.slice(1, 13);
  }
  
  // Get ayanamsa value and convert to sidereal
  const ayanamsaValue = getAyanamsa(date, ayanamsa);
  
  // Convert to sidereal longitude
  ascendant = normalizeLongitude(ascendant - ayanamsaValue);
  houses = houses.map(cusp => normalizeLongitude(cusp - ayanamsaValue));
  
  return {
    longitude: ascendant,
    rasi: getRashi(ascendant),
    degree: getRashiDegree(ascendant),
    houses: houses.slice(0, 12),
    ayanamsaValue,
  };
}

/**
 * Calculate house cusps only (without lagna details)
 * @param date - Date and time for calculation
 * @param location - Geographic location
 * @param options - Calculation options
 * @returns Array of 12 house cusp longitudes
 */
export function calculateHouses(
  date: Date,
  location: GeoLocation,
  options: CalculationOptions = {}
): number[] {
  const lagnaInfo = calculateLagna(date, location, options);
  return lagnaInfo.houses;
}

/**
 * Determine which house a planet is in
 * @param planetLongitude - Planet's sidereal longitude
 * @param houses - Array of 12 house cusp longitudes
 * @returns House number (1-12)
 */
export function getHousePosition(planetLongitude: number, houses: number[]): number {
  const normPlanet = normalizeLongitude(planetLongitude);
  
  for (let i = 0; i < 12; i++) {
    const houseStart = houses[i];
    const houseEnd = houses[(i + 1) % 12];
    
    if (houseEnd !== undefined && houseStart !== undefined) {
      // Handle wrap-around at 360°
      if (houseStart > houseEnd) {
        // House spans 0°
        if (normPlanet >= houseStart || normPlanet < houseEnd) {
          return i + 1;
        }
      } else {
        if (normPlanet >= houseStart && normPlanet < houseEnd) {
          return i + 1;
        }
      }
    }
  }
  
  // Default to house 1 if not found
  return 1;
}
