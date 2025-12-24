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
 * Calculate solar noon (when sun crosses the meridian)
 * @param date - Date for solar noon calculation
 * @param location - Geographic location coordinates
 * @returns SolarNoonResult with noon time and sun's altitude at meridian
 * @example
 * ```typescript
 * const solarNoon = calculateSolarNoon(new Date(), {
 *   latitude: 51.5074,
 *   longitude: -0.1278,
 *   timezone: 0
 * });
 *
 * console.log(`Solar noon: ${solarNoon.time.toLocaleTimeString()}`);
 * console.log(`Sun altitude at noon: ${solarNoon.altitude.toFixed(1)}°`);
 * ```
 */
export declare function calculateSolarNoon(date: Date, location: GeoLocation): SolarNoonResult;
/**
 * Calculate sun's path throughout the day (hourly positions)
 * @param date - Date for sun path calculation
 * @param location - Geographic location coordinates
 * @returns Array of sun positions with time, azimuth, and altitude for each hour
 * @example
 * ```typescript
 * const sunPath = calculateSunPath(new Date(), {
 *   latitude: 35.6762,
 *   longitude: 139.6503,
 *   timezone: 9
 * });
 *
 * // Find sun position at noon
 * const noonPosition = sunPath.find(pos => pos.time.getHours() === 12);
 * console.log(`Sun at noon: ${noonPosition?.azimuth.toFixed(1)}° azimuth, ${noonPosition?.altitude.toFixed(1)}° altitude`);
 * ```
 */
export declare function calculateSunPath(date: Date, location: GeoLocation): {
    time: Date;
    azimuth: number;
    altitude: number;
}[];
//# sourceMappingURL=sun.d.ts.map