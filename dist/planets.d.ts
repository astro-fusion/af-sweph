/**
 * Planet Calculations for @AstroFusion/sweph
 */
import type { Planet, CalculationOptions } from './types';
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
//# sourceMappingURL=planets.d.ts.map