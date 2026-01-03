/**
 * Utility Functions for @af/sweph-node
 *
 * This module provides shared utility functions for astronomical calculations.
 * It lazily loads the native module to prevent webpack bundling issues.
 */
export { normalizeLongitude, getRashi, getRashiDegree, isRetrograde, getNakshatra, julianToDate, formatLongitude } from '@af/sweph-core';
/**
 * Get the native Swiss Ephemeris module
 * Uses lazy loading to prevent webpack from bundling native modules
 *
 * @returns Swiss Ephemeris native module instance
 * @throws Error if module not initialized
 * @internal
 */
export declare function getNativeModule(): any;
/**
 * Initialize the Swiss Ephemeris system
 * Must be called (and awaited) before using any calculation functions
 *
 * @param options - Optional configuration
 * @throws Error if initialization fails
 */
export declare function initializeSweph(options?: any): Promise<void>;
/**
 * Set custom path to Swiss Ephemeris data files
 * @param customPath - Directory path containing ephemeris files (.se1 files)
 */
export declare function setEphemerisPath(customPath: string): void;
/**
 * Get the ayanamsa correction value for sidereal calculations
 */
export declare function getAyanamsa(date: Date, ayanamsaType?: number): number;
/**
 * Convert JavaScript Date to Julian Day number
 */
export declare function dateToJulian(date: Date): number;
/**
 * Get Julian Day for a date (alias for dateToJulian)
 */
export declare function getJulianDay(date: Date): number;
/**
 * Helper to call swe_rise_trans with fallback for different signatures
 * @internal
 */
export declare function callRiseTrans(jd: number, id: number, flag: number, location: {
    longitude: number;
    latitude: number;
}): any;
/**
 * Helper to call swe_azalt with fallback for different signatures
 * @internal
 */
export declare function callAzAlt(jd: number, location: {
    longitude: number;
    latitude: number;
}, planetPos: {
    longitude: number;
    latitude: number;
    distance: number;
}): any;
//# sourceMappingURL=utils.d.ts.map