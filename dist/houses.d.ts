/**
 * House and Lagna Calculations for @AstroFusion/sweph
 */
import type { LagnaInfo, GeoLocation, CalculationOptions } from './types';
/**
 * Calculate Lagna (Ascendant) and house cusps
 * @param date - Date and time for calculation
 * @param location - Geographic location
 * @param options - Calculation options
 * @returns Lagna and house information
 */
export declare function calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): LagnaInfo;
/**
 * Calculate house cusps only (without lagna details)
 * @param date - Date and time for calculation
 * @param location - Geographic location
 * @param options - Calculation options
 * @returns Array of 12 house cusp longitudes
 */
export declare function calculateHouses(date: Date, location: GeoLocation, options?: CalculationOptions): number[];
/**
 * Determine which house a planet is in
 * @param planetLongitude - Planet's sidereal longitude
 * @param houses - Array of 12 house cusp longitudes
 * @returns House number (1-12)
 */
export declare function getHousePosition(planetLongitude: number, houses: number[]): number;
//# sourceMappingURL=houses.d.ts.map