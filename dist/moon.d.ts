/**
 * Moon Calculations for @AstroFusion/sweph
 */
import type { MoonData, NextMoonPhases, GeoLocation } from './types';
/**
 * Calculate moon data including rise/set and phase
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Moon data including rise, set, phase, illumination
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