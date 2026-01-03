/**
 * Moon Calculations for @AstroFusion/sweph
 */
import type { MoonData, NextMoonPhases, GeoLocation } from './types';
/**
 * Calculate comprehensive moon data including rise/set times and phase
 * @param date - Date for moon calculation (local time)
 * @param location - Geographic location coordinates
 * @returns MoonData object with rise/set times, phase, and illumination
 * @example
 * ```typescript
 * const moonData = calculateMoonData(new Date(), {
 *   latitude: 27.7172,
 *   longitude: 85.324,
 *   timezone: 5.75
 * });
 *
 * console.log(`Moonrise: ${moonData.moonrise?.toLocaleTimeString()}`);
 * console.log(`Phase: ${moonData.phaseName} (${moonData.illumination.toFixed(1)}% illuminated)`);
 * ```
 */
export declare function calculateMoonData(date: Date, location: GeoLocation): MoonData;
/**
 * Calculate current moon phase
 * @param date - Date for calculation
 * @returns Moon phase information
 */
export declare function calculateMoonPhase(date: Date): {
    phase: number;
    illumination: number;
    age: number;
    phaseName: string;
};
/**
 * Calculate dates of next moon phases
 * @param date - Starting date
 * @returns Dates of upcoming moon phases
 */
export declare function calculateNextMoonPhases(date: Date): NextMoonPhases;
//# sourceMappingURL=moon.d.ts.map