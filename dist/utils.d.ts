/**
 * Utility Functions for @AstroFusion/sweph
 *
 * This module provides shared utility functions for astronomical calculations.
 * It lazily loads the native module to prevent webpack bundling issues.
 */
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
 * @param options.wasmUrl - Custom URL for WASM file (browser only)
 * @throws Error if initialization fails
 *
 * @example
 * ```typescript
 * // Initialize before using
 * await initializeSweph();
 *
 * // Now you can use calculation functions
 * const planets = calculatePlanets(new Date());
 * ```
 */
export declare function initializeSweph(options?: {
    wasmUrl?: string;
}): Promise<void>;
/**
 * Set custom path to Swiss Ephemeris data files
 * @param customPath - Directory path containing ephemeris files (.se1 files)
 */
export declare function setEphemerisPath(customPath: string): void;
/**
 * Get the ayanamsa correction value for sidereal calculations
 *
 * @param date - The date for which to calculate ayanamsa
 * @param ayanamsaType - The ayanamsa system to use (default: 1 for Lahiri)
 * @returns The ayanamsa correction value in degrees
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-01');
 * const ayanamsa = getAyanamsa(date, 1); // Lahiri ayanamsa
 * console.log(`Lahiri ayanamsa: ${ayanamsa.toFixed(4)}°`);
 * ```
 */
export declare function getAyanamsa(date: Date, ayanamsaType?: number): number;
/**
 * Convert JavaScript Date to Julian Day number
 *
 * @param date - The date to convert (UTC)
 * @returns The Julian Day number for the given date
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-01T12:00:00Z');
 * const jd = dateToJulian(date);
 * console.log(`Julian Day: ${jd}`); // 2460311.0
 * ```
 */
export declare function dateToJulian(date: Date): number;
/**
 * Convert Julian Day number to JavaScript Date
 *
 * @param jd - The Julian Day number to convert
 * @param timezoneOffset - Timezone offset in hours from UTC (default: 0)
 * @returns JavaScript Date object
 *
 * @example
 * ```typescript
 * const jd = 2460311.0;
 * const date = julianToDate(jd);
 * console.log(date.toISOString()); // 2024-01-01T12:00:00.000Z
 * ```
 */
export declare function julianToDate(jd: number, timezoneOffset?: number): Date;
/**
 * Get Julian Day for a date (alias for dateToJulian)
 */
export declare function getJulianDay(date: Date): number;
/**
 * Normalize ecliptic longitude to 0-360° range
 *
 * @param longitude - Longitude value in degrees (can be any real number)
 * @returns Normalized longitude between 0 and 360 degrees
 *
 * @example
 * ```typescript
 * normalizeLongitude(390);  // 30
 * normalizeLongitude(-30);  // 330
 * normalizeLongitude(180);  // 180
 * ```
 */
export declare function normalizeLongitude(longitude: number): number;
/**
 * Get rashi (zodiac sign) from longitude
 * @returns Rashi number 1-12
 */
export declare function getRashi(longitude: number): number;
/**
 * Get degree within rashi from longitude
 * @returns Degree 0-30
 */
export declare function getRashiDegree(longitude: number): number;
/**
 * Calculate if a planet is retrograde based on speed
 */
export declare function isRetrograde(speed: number): boolean;
/**
 * Calculate nakshatra (lunar mansion) from ecliptic longitude
 *
 * @param longitude - Ecliptic longitude in degrees
 * @returns Object containing nakshatra number (1-27) and pada (1-4)
 *
 * @example
 * ```typescript
 * const result = getNakshatra(30);
 * console.log(`Nakshatra: ${result.number}, Pada: ${result.pada}`);
 * // Nakshatra: 2, Pada: 1 (for longitude 30°)
 * ```
 */
export declare function getNakshatra(longitude: number): {
    number: number;
    pada: number;
};
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