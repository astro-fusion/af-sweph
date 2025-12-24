/**
 * House and Lagna Calculations for @AstroFusion/sweph
 */
import type { LagnaInfo, GeoLocation, CalculationOptions } from './types';
/**
 * Calculate Lagna (Ascendant) and house cusps for Vedic astrology
 * @param date - Birth date and time (local time)
 * @param location - Birth location coordinates
 * @param options - Calculation options (ayanamsa, house system)
 * @returns LagnaInfo object with ascendant and all 12 house cusps
 * @throws Error if Swiss Ephemeris calculation fails
 * @example
 * ```typescript
 * const lagna = calculateLagna(new Date('1990-01-15T14:30:00'), {
 *   latitude: 27.7172,
 *   longitude: 85.324,
 *   timezone: 5.75
 * }, {
 *   ayanamsa: AYANAMSA.LAHIRI,
 *   houseSystem: HOUSE_SYSTEMS.PLACIDUS
 * });
 *
 * console.log(`Ascendant: ${lagna.rasi}°${lagna.degree.toFixed(2)}' in ${RASHIS[lagna.rasi-1].name}`);
 * console.log(`House 7 (Descendant): ${lagna.houses[6].toFixed(2)}°`);
 * ```
 */
export declare function calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): LagnaInfo;
/**
 * Calculate house cusps only (without ascendant details)
 * @param date - Birth date and time (local time)
 * @param location - Birth location coordinates
 * @param options - Calculation options (ayanamsa, house system)
 * @returns Array of 12 house cusp longitudes in degrees (0°-360°)
 * @example
 * ```typescript
 * const houses = calculateHouses(new Date(), {
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   timezone: -5
 * });
 *
 * console.log(`1st House: ${houses[0].toFixed(2)}°`);
 * console.log(`7th House: ${houses[6].toFixed(2)}°`); // Descendant
 * ```
 */
export declare function calculateHouses(date: Date, location: GeoLocation, options?: CalculationOptions): number[];
/**
 * Determine which house a planet occupies based on its longitude
 * @param planetLongitude - Planet's ecliptic longitude in degrees (0-360)
 * @param houses - Array of 12 house cusp longitudes from calculateHouses()
 * @returns House number (1-12) where the planet is located
 * @example
 * ```typescript
 * const lagna = calculateLagna(birthDate, location);
 * const planets = calculatePlanets(birthDate);
 * const sunHouse = getHousePosition(planets[0].longitude, lagna.houses);
 * console.log(`Sun is in house ${sunHouse}`);
 * ```
 */
export declare function getHousePosition(planetLongitude: number, houses: number[]): number;
//# sourceMappingURL=houses.d.ts.map