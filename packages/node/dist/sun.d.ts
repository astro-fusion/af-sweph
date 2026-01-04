/**
 * Sun Calculations for @AstroFusion/sweph
 */
import type { SunTimes, SolarNoonResult, GeoLocation } from './types';
/**
 * Calculate sunrise, sunset, and twilight times for a location
 * @param date - Date for sun time calculation (local time)
 * @param location - Geographic location coordinates
 * @returns SunTimes object with all sunrise/sunset and twilight times
 * @example
 * ```typescript
 * const sunTimes = calculateSunTimes(new Date(), {
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   timezone: -5
 * });
 *
 * console.log(`Sunrise: ${sunTimes.sunrise?.toLocaleTimeString()}`);
 * console.log(`Sunset: ${sunTimes.sunset?.toLocaleTimeString()}`);
 * console.log(`Day length: ${sunTimes.dayLength.toFixed(1)} hours`);
 * ```
 */
export declare function calculateSunTimes(date: Date, location: GeoLocation): SunTimes;
/**
 * Calculate solar noon (meridian transit)
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Solar noon time and sun altitude
 */
export declare function calculateSolarNoon(date: Date, location: GeoLocation): SolarNoonResult;
/**
 * Calculate daily sun path (position at specified intervals)
 * @param date - Date for calculation
 * @param location - Geographic location
 * @param intervalMinutes - Interval between points in minutes (default: 60)
 * @returns Array of sun positions
 */
export declare function calculateSunPath(date: Date, location: GeoLocation, intervalMinutes?: number): {
    time: Date;
    azimuth: number;
    altitude: number;
}[];
//# sourceMappingURL=sun.d.ts.map