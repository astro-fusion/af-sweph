/**
 * Utility Functions for @AstroFusion/sweph
 */
/**
 * Get the native Swiss Ephemeris module
 * Uses node-gyp-build to load pre-built binaries
 */
export declare function getNativeModule(): any;
/**
 * Initialize the Swiss Ephemeris
 * Automatically finds and sets ephemeris path
 */
export declare function initializeSweph(): void;
/**
 * Set custom ephemeris file path
 */
export declare function setEphemerisPath(path: string): void;
/**
 * Get the current ayanamsa value
 * @param date - Date for calculation
 * @param ayanamsaType - Ayanamsa system (default: Lahiri = 1)
 */
export declare function getAyanamsa(date: Date, ayanamsaType?: number): number;
/**
 * Convert Date to Julian Day number
 */
export declare function dateToJulian(date: Date): number;
/**
 * Convert Julian Day to Date
 */
export declare function julianToDate(jd: number, timezoneOffset?: number): Date;
/**
 * Get Julian Day for a date (alias for dateToJulian)
 */
export declare function getJulianDay(date: Date): number;
/**
 * Normalize longitude to 0-360 range
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
 * Get nakshatra from longitude
 * @returns Object with nakshatra number (1-27) and pada (1-4)
 */
export declare function getNakshatra(longitude: number): {
    number: number;
    pada: number;
};
//# sourceMappingURL=utils.d.ts.map