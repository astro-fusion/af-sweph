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
 * Calculate current moon phase and illumination
 * @param date - Date for moon phase calculation
 * @returns Object with phase angle, illumination percentage, age in days, and phase name
 * @example
 * ```typescript
 * const phase = calculateMoonPhase(new Date());
 * console.log(`${phase.phaseName}: ${phase.illumination.toFixed(1)}% illuminated`);
 * console.log(`Moon age: ${phase.age.toFixed(1)} days`);
 * ```
 */
export declare function calculateMoonPhase(date: Date): {
    phase: number;
    illumination: number;
    age: number;
    phaseName: string;
};
/**
 * Calculate dates of upcoming moon phases
 * @param date - Starting date to search from
 * @returns NextMoonPhases object with dates of next new moon, full moon, etc.
 * @example
 * ```typescript
 * const phases = calculateNextMoonPhases(new Date());
 * console.log(`Next Full Moon: ${phases.fullMoon.toDateString()}`);
 * console.log(`Next New Moon: ${phases.newMoon.toDateString()}`);
 * ```
 */
export declare function calculateNextMoonPhases(date: Date): NextMoonPhases;
//# sourceMappingURL=moon.d.ts.map