/**
 * Utility Functions for @AstroFusion/sweph
 */
/**
 * Get the native Swiss Ephemeris module
 * Automatically loads pre-built binaries or falls back to swisseph-v2
 * @returns Swiss Ephemeris native module instance
 * @throws Error if no compatible native module can be loaded
 * @internal
 */
export declare function getNativeModule(): any;
/**
 * Initialize the Swiss Ephemeris system
 * Automatically locates and sets the ephemeris data file path
 * Searches in common locations: ./ephe, ../ephe, etc.
 * @throws Error if ephemeris files cannot be found
 * @internal
 */
export declare function initializeSweph(): void;
/**
 * Set custom path to Swiss Ephemeris data files
 * @param path - Directory path containing ephemeris files (.se1 files)
 * @example
 * ```typescript
 * // Set custom ephemeris path
 * setEphemerisPath('/path/to/ephemeris/files');
 *
 * // Then initialize
 * initializeSweph();
 * ```
 */
export declare function setEphemerisPath(path: string): void;
/**
 * Get the ayanamsa correction value for sidereal calculations
 * @param date - Date for ayanamsa calculation
 * @param ayanamsaType - Ayanamsa system identifier (default: 1 = Lahiri)
 * @returns Ayanamsa value in degrees to subtract from tropical longitude
 * @example
 * ```typescript
 * import { AYANAMSA } from '@AstroFusion/sweph';
 *
 * const ayanamsa = getAyanamsa(new Date(), AYANAMSA.LAHIRI);
 * console.log(`Lahiri ayanamsa: ${ayanamsa.toFixed(4)}°`);
 * ```
 */
export declare function getAyanamsa(date: Date, ayanamsaType?: number): number;
/**
 * Convert JavaScript Date to Julian Day number
 * @param date - JavaScript Date object
 * @returns Julian Day number (days since J2000 epoch)
 * @example
 * ```typescript
 * const jd = dateToJulian(new Date('2024-01-01'));
 * console.log(`Julian Day: ${jd}`); // ~2460311.5
 * ```
 */
export declare function dateToJulian(date: Date): number;
/**
 * Convert Julian Day number to JavaScript Date
 * @param jd - Julian Day number
 * @param timezoneOffset - Timezone offset in hours (e.g., 5.5 for IST)
 * @returns JavaScript Date object
 * @example
 * ```typescript
 * const date = julianToDate(2460311.5, 5.5); // IST timezone
 * console.log(date.toISOString()); // 2024-01-01T00:00:00.000Z (adjusted)
 * ```
 */
export declare function julianToDate(jd: number, timezoneOffset?: number): Date;
/**
 * Get Julian Day for a date (alias for dateToJulian)
 */
export declare function getJulianDay(date: Date): number;
/**
 * Normalize ecliptic longitude to 0-360° range
 * @param longitude - Longitude value (can be any number)
 * @returns Normalized longitude between 0° and 360°
 * @example
 * ```typescript
 * normalizeLongitude(370);  // 10
 * normalizeLongitude(-10);  // 350
 * normalizeLongitude(360);  // 0
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
 * @param longitude - Ecliptic longitude in degrees
 * @returns Object containing nakshatra number (1-27) and pada (1-4)
 * @example
 * ```typescript
 * const nakshatra = getNakshatra(45.5);
 * console.log(`Nakshatra ${nakshatra.number}, Pada ${nakshatra.pada}`);
 * // Output: Nakshatra 4, Pada 1 (Ardra)
 * ```
 */
export declare function getNakshatra(longitude: number): {
    number: number;
    pada: number;
};
//# sourceMappingURL=utils.d.ts.map