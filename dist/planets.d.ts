/**
 * Planet Calculations for @AstroFusion/sweph
 */
import type { Planet, CalculationOptions, GeoLocation } from './types';
/**
 * Calculate positions for all 9 Vedic planets
 * @param date - Date for calculation
 * @param options - Calculation options (ayanamsa, etc.)
 * @returns Array of planet positions
 */
export declare function calculatePlanets(date: Date, options?: CalculationOptions): Planet[];
/**
 * Calculate position for a single planet
 * @param planetId - Swiss Ephemeris planet ID
 * @param date - Date for calculation
 * @param options - Calculation options
 * @returns Planet position or null if calculation fails
 */
export declare function calculateSinglePlanet(planetId: number, date: Date, options?: CalculationOptions): Planet | null;
/**
 * Calculate rise and set times for a planet
 * @param planetId - Swiss Ephemeris planet ID
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Rise and set times
 */
export declare function calculatePlanetRiseSetTimes(planetId: number, date: Date, location: GeoLocation): {
    rise: Date | null;
    set: Date | null;
    transit: Date | null;
    transitAltitude: number;
    transitDistance: number;
};
//# sourceMappingURL=planets.d.ts.map