/**
 * Sun Calculations for @AstroFusion/sweph
 */
import type { SunTimes, SolarNoonResult, GeoLocation } from './types';
/**
 * Calculate sunrise, sunset, and twilight times
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Sun times including sunrise, sunset, twilights
 */
export declare function calculateSunTimes(date: Date, location: GeoLocation): SunTimes;
/**
 * Calculate solar noon (meridian transit)
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Solar noon time and sun altitude
 */
export declare function calculateSolarNoon(date: Date, location: GeoLocation): SolarNoonResult;
//# sourceMappingURL=sun.d.ts.map