"use strict";
/**
 * Sun Calculations for @AstroFusion/sweph
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSunTimes = calculateSunTimes;
exports.calculateSolarNoon = calculateSolarNoon;
exports.calculateSunPath = calculateSunPath;
const types_1 = require("./types");
const utils_1 = require("./utils");
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
function calculateSunTimes(date, location) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const timezone = location.timezone ?? 0;
    // Convert to UTC midnight
    const utcDate = new Date(date.getTime() - timezone * 60 * 60 * 1000);
    utcDate.setUTCHours(0, 0, 0, 0);
    const jd = (0, utils_1.dateToJulian)(utcDate);
    // Calculation flags for rise/set
    const CALC_RISE = sweph.SE_CALC_RISE || 1;
    const CALC_SET = sweph.SE_CALC_SET || 2;
    const SEFLG_SWIEPH = sweph.SEFLG_SWIEPH || 2; // Swiss Ephemeris flag
    // Calculate sunrise using correct swe_rise_trans signature:
    // (tjd_ut, ipl, starname, epheflag, rsmi, longitude, latitude, height, atpress, attemp)
    const sunriseResult = sweph.swe_rise_trans(jd, types_1.PlanetId.SUN, '', // starname - empty string for planets
    SEFLG_SWIEPH, // epheflag
    CALC_RISE, // rsmi - rise/set/transit flag
    location.longitude, location.latitude, 0, // height
    0, // atpress - atmospheric pressure
    0 // attemp - atmospheric temperature
    );
    // Calculate sunset
    const sunsetResult = sweph.swe_rise_trans(jd, types_1.PlanetId.SUN, '', // starname - empty string for planets
    SEFLG_SWIEPH, // epheflag
    CALC_SET, // rsmi
    location.longitude, location.latitude, 0, // height
    0, // atpress
    0 // attemp
    );
    // Extract Julian day results - swe_rise_trans returns { transitTime, name } or { error }
    const sunriseJd = sunriseResult?.transitTime || sunriseResult?.dret?.[0] || jd + 0.25;
    const sunsetJd = sunsetResult?.transitTime || sunsetResult?.dret?.[0] || jd + 0.75;
    // Convert to dates
    const sunrise = (0, utils_1.julianToDate)(sunriseJd, timezone);
    const sunset = (0, utils_1.julianToDate)(sunsetJd, timezone);
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
 * Calculate civil, nautical, or astronomical twilight time
 * @param jd - Julian day number at midnight (local time)
 * @param location - Geographic location coordinates
 * @param depression - Sun depression angle in degrees (6=civil, 12=nautical, 18=astronomical)
 * @param isRise - true for morning twilight start, false for evening twilight end
 * @param timezone - Timezone offset in hours from UTC
 * @returns Twilight Date object or null if twilight doesn't occur at this location/date
 * @internal
 */
function calculateTwilightTime(jd, location, depression, isRise, timezone) {
    try {
        const sweph = (0, utils_1.getNativeModule)();
        const SEFLG_SWIEPH = sweph.SEFLG_SWIEPH || 2;
        const flags = isRise
            ? (sweph.SE_CALC_RISE || 1)
            : (sweph.SE_CALC_SET || 2);
        // Use civil twilight flag with custom depression
        const result = sweph.swe_rise_trans(jd, types_1.PlanetId.SUN, '', // starname - empty string for planets
        SEFLG_SWIEPH, // epheflag
        flags | (sweph.SE_BIT_CIVIL_TWILIGHT || 0x100), // rsmi
        location.longitude, location.latitude, 0, // height
        0, // atpress
        0 // attemp
        );
        // swe_rise_trans returns { transitTime, name } or { error }
        const transitTime = result?.transitTime || result?.dret?.[0];
        if (transitTime) {
            return (0, utils_1.julianToDate)(transitTime, timezone);
        }
    }
    catch {
        // Twilight calculation failed
    }
    return null;
}
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
function calculateSolarNoon(date, location) {
    const sunTimes = calculateSunTimes(date, location);
    // Calculate sun altitude at noon
    const sweph = (0, utils_1.getNativeModule)();
    const timezone = location.timezone ?? 0;
    // Convert solar noon to UTC
    const noonUtc = new Date(sunTimes.solarNoon.getTime() - timezone * 60 * 60 * 1000);
    const jd = (0, utils_1.dateToJulian)(noonUtc);
    // Calculate sun position at noon
    const result = sweph.swe_calc_ut(jd, types_1.PlanetId.SUN, sweph.SEFLG_EQUATORIAL || 0x0800);
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
 * @param sweph - Swiss Ephemeris native module instance
 * @param jd - Julian day number for calculation
 * @param location - Observer's geographic location
 * @param planetPos - Celestial body position in ecliptic coordinates
 * @returns Object with azimuth (0°=North, 90°=East) and altitude (degrees above horizon)
 * @internal
 */
function calculateAzAlt(sweph, jd, location, planetPos) {
    // swe_azalt expects: tjd_ut, calc_flag, geopos, atpress, attemp, xin
    // xin: array of 3 doubles: longitude, latitude, distance
    const geopos = [location.longitude, location.latitude, 0];
    const xin = [planetPos.longitude, planetPos.latitude, planetPos.distance];
    const result = sweph.swe_azalt(jd, sweph.SE_EQU2HOR, // Flag to convert equatorial to horizontal
    geopos, 0, // Pressure (0 = default 1013.25 mbar)
    10, // Temperature (10C)
    xin);
    return {
        azimuth: result.azimuth || result[0] || 0,
        altitude: result.altitude || result[1] || 0
    };
}
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
function calculateSunPath(date, location) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
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
        const jd = (0, utils_1.dateToJulian)(utcTime);
        // Calculate Sun position
        // SEFLG_EQUATORIAL | SEFLG_SPEED
        const flags = (sweph.SEFLG_EQUATORIAL || 0x0800) | (sweph.SEFLG_SPEED || 0x100);
        const result = sweph.swe_calc_ut(jd, types_1.PlanetId.SUN, flags);
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
            const azAlt = calculateAzAlt(sweph, jd, location, { longitude, latitude, distance });
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