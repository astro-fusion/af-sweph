/**
 * Linear interpolation utilities for ephemeris data.
 *
 * All planetary longitudes are on a circle [0, 360). The shortest-arc
 * interpolation handles the 359° → 1° wrap-around correctly.
 */
/**
 * Normalise an angle to [0, 360).
 */
export declare function norm360(deg: number): number;
/**
 * Linear interpolation with 360° wrap-around.
 *
 * @param a   Start value (degrees)
 * @param b   End value (degrees)
 * @param t   Fraction [0, 1] — how far between a and b
 */
export declare function interpolateLongitude(a: number, b: number, t: number): number;
/**
 * Linearly interpolate a plain scalar (speed, declination, etc.).
 */
export declare function interpolateScalar(a: number, b: number, t: number): number;
/**
 * Convert a Date to a UTC day key "YYYY-MM-DD".
 */
export declare function toUTCDayKey(date: Date): string;
/**
 * Return the "YYYY-MM-DD" key for the next calendar day.
 */
export declare function nextDayKey(key: string): string;
/**
 * Fractional position within the UTC day [0, 1).
 */
export declare function dayFraction(date: Date): number;
//# sourceMappingURL=interpolate.d.ts.map