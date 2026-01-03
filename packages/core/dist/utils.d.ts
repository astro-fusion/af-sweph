/**
 * @af/sweph-core - Pure Utility Functions
 *
 * Platform-agnostic calculation utilities.
 * These functions have no dependencies on native modules.
 */
/**
 * Normalize ecliptic longitude to 0-360° range
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
 * @returns Object containing nakshatra number (1-27) and pada (1-4)
 */
export declare function getNakshatra(longitude: number): {
    number: number;
    pada: number;
};
/**
 * Convert Julian Day number to JavaScript Date (pure JS, no native dependency)
 */
export declare function julianToDate(jd: number, timezoneOffset?: number): Date;
/**
 * Get moon phase name from phase angle (0-360)
 */
export declare function getMoonPhaseName(phaseAngle: number): string;
/**
 * Calculate degrees, minutes, seconds from decimal degrees
 */
export declare function degreesToDMS(degrees: number): {
    degrees: number;
    minutes: number;
    seconds: number;
};
/**
 * Format longitude to string (e.g., "15°30'45" Aries")
 */
export declare function formatLongitude(longitude: number): string;
//# sourceMappingURL=utils.d.ts.map