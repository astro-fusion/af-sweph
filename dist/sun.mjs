/**
 * Sun Calculations for @AstroFusion/sweph
 */
import { PlanetId } from './types.js';
import { initializeSweph, getNativeModule, dateToJulian, julianToDate, callRiseTrans, callAzAlt } from './utils.js';
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
export function calculateSunTimes(date, location) {
    initializeSweph();
    const sweph = getNativeModule();
    const timezone = location.timezone ?? 0;
    // Convert to UTC midnight
    const utcDate = new Date(date.getTime() - timezone * 60 * 60 * 1000);
    utcDate.setUTCHours(0, 0, 0, 0);
    const jd = dateToJulian(utcDate);
    // Calculation flags for rise/set
    const CALC_RISE = sweph.SE_CALC_RISE || 1;
    const CALC_SET = sweph.SE_CALC_SET || 2;
    // Calculate sunrise
    const sunriseResult = callRiseTrans(jd, PlanetId.SUN, CALC_RISE, location);
    // Calculate sunset
    const sunsetResult = callRiseTrans(jd, PlanetId.SUN, CALC_SET, location);
    // Extract Julian day results - swe_rise_trans returns { transitTime, name } or { error }
    const sunriseJd = sunriseResult?.transitTime || sunriseResult?.dret?.[0] || jd + 0.25;
    const sunsetJd = sunsetResult?.transitTime || sunsetResult?.dret?.[0] || jd + 0.75;
    // Convert to dates
    const sunrise = julianToDate(sunriseJd, timezone);
    const sunset = julianToDate(sunsetJd, timezone);
    // Calculate day length
    const dayLengthMs = sunset.getTime() - sunrise.getTime();
    const dayLength = dayLengthMs / (1000 * 60 * 60); // hours
    // Calculate solar noon (midpoint between sunrise and sunset)
    const solarNoon = new Date(sunrise.getTime() + dayLengthMs / 2);
    // Calculate civil twilight (sun 6° below horizon)
    const civilTwilightStart = calculateTwilightTime(jd, location, 6, true, timezone);
    const civilTwilightEnd = calculateTwilightTime(jd, location, 6, false, timezone);
    // Calculate nautical twilight (sun 12° below horizon)
    const nauticalTwilightStart = calculateTwilightTime(jd, location, 12, true, timezone);
    const nauticalTwilightEnd = calculateTwilightTime(jd, location, 12, false, timezone);
    return {
        sunrise,
        sunset,
        solarNoon,
        dayLength,
        civilTwilightStart,
        civilTwilightEnd,
        nauticalTwilightStart,
        nauticalTwilightEnd,
    };
}
/**
 * Calculate twilight time for a specific depression angle
 * @param jd - Julian day at midnight
 * @param location - Geographic location
 * @param depression - Depression angle in degrees (6=civil, 12=nautical, 18=astronomical)
 * @param isRise - true for morning twilight, false for evening
 * @param timezone - Timezone offset in hours
 * @returns Twilight time or null if doesn't occur
 */
function calculateTwilightTime(jd, location, depression, isRise, timezone) {
    try {
        const sweph = getNativeModule();
        const flags = isRise
            ? (sweph.SE_CALC_RISE || 1)
            : (sweph.SE_CALC_SET || 2);
        // Use civil twilight flag with custom depression
        const result = callRiseTrans(jd, PlanetId.SUN, flags | (sweph.SE_BIT_CIVIL_TWILIGHT || 0x100), location);
        // swe_rise_trans returns { transitTime, name } or { error }
        const transitTime = result?.transitTime || result?.dret?.[0];
        if (transitTime) {
            return julianToDate(transitTime, timezone);
        }
    }
    catch {
        // Twilight calculation failed
    }
    return null;
}
/**
 * Calculate solar noon (meridian transit)
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Solar noon time and sun altitude
 */
export function calculateSolarNoon(date, location) {
    const sunTimes = calculateSunTimes(date, location);
    // Calculate sun altitude at noon
    const sweph = getNativeModule();
    const timezone = location.timezone ?? 0;
    // Convert solar noon to UTC
    const noonUtc = new Date(sunTimes.solarNoon.getTime() - timezone * 60 * 60 * 1000);
    const jd = dateToJulian(noonUtc);
    // Calculate sun position at noon
    const result = sweph.swe_calc_ut(jd, PlanetId.SUN, sweph.SEFLG_EQUATORIAL || 0x0800);
    let declination = 0;
    if (Array.isArray(result)) {
        declination = result[1] || 0;
    }
    else if (result?.xx) {
        declination = result.xx[1] || 0;
    }
    // Calculate altitude at meridian transit
    // altitude = 90° - |latitude - declination|
    const altitude = 90 - Math.abs(location.latitude - declination);
    return {
        time: sunTimes.solarNoon,
        altitude: Math.max(0, altitude),
    };
}
/**
 * Calculate azimuth and altitude for horizontal coordinate conversion
 * Converts ecliptic coordinates to horizontal coordinates (azimuth/altitude)
 * @param sweph - Swiss Ephemeris native module instance
 * @param jd - Julian day number for calculation
 * @param location - Observer's geographic location
 * @param planetPos - Celestial body position in ecliptic coordinates
 * @returns Object with azimuth (0°=North, 90°=East) and altitude (degrees above horizon)
 * @internal
 */
function calculateAzAlt(jd, location, planetPos) {
    const result = callAzAlt(jd, location, planetPos);
    return {
        azimuth: result.azimuth || result[0] || 0,
        altitude: result.altitude || result[1] || 0
    };
}
/**
 * Calculate daily sun path (position every hour)
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Array of sun positions
 */
export function calculateSunPath(date, location) {
    initializeSweph();
    const sweph = getNativeModule();
    const timezone = location.timezone ?? 0;
    // Start from midnight
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const path = [];
    // Calculate for every hour of the day (0 to 23)
    for (let i = 0; i < 24; i++) {
        const time = new Date(startOfDay.getTime() + i * 60 * 60 * 1000);
        // Convert to UTC for calculation
        const utcTime = new Date(time.getTime() - timezone * 60 * 60 * 1000);
        const jd = dateToJulian(utcTime);
        // Calculate Sun position
        // SEFLG_EQUATORIAL | SEFLG_SPEED
        const flags = (sweph.SEFLG_EQUATORIAL || 0x0800) | (sweph.SEFLG_SPEED || 0x100);
        const result = sweph.swe_calc_ut(jd, PlanetId.SUN, flags);
        if (result) {
            let longitude = 0;
            let latitude = 0;
            let distance = 0;
            if (Array.isArray(result)) {
                longitude = result[0] || 0;
                latitude = result[1] || 0;
                distance = result[2] || 0;
            }
            else if (result.xx) {
                longitude = result.xx[0] || 0;
                latitude = result.xx[1] || 0;
                distance = result.xx[2] || 0;
            }
            const azAlt = calculateAzAlt(jd, location, { longitude, latitude, distance });
            path.push({
                time,
                azimuth: azAlt.azimuth,
                altitude: azAlt.altitude
            });
        }
    }
    return path;
}
//# sourceMappingURL=sun.js.map