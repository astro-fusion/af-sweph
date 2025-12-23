"use strict";
/**
 * Sun Calculations for @AstroFusion/sweph
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateSunTimes = calculateSunTimes;
exports.calculateSolarNoon = calculateSolarNoon;
const types_1 = require("./types");
const utils_1 = require("./utils");
/**
 * Calculate sunrise, sunset, and twilight times
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Sun times including sunrise, sunset, twilights
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
    // Geographic array format: [longitude, latitude, altitude]
    const geopos = [location.longitude, location.latitude, 0];
    // Calculate sunrise
    const sunriseResult = sweph.swe_rise_trans(jd, types_1.PlanetId.SUN, 0, // Star name (null for planets)
    CALC_RISE, geopos, 0, // Atmospheric pressure
    0 // Atmospheric temperature
    );
    // Calculate sunset
    const sunsetResult = sweph.swe_rise_trans(jd, types_1.PlanetId.SUN, 0, CALC_SET, geopos, 0, 0);
    // Extract Julian day results
    const sunriseJd = sunriseResult?.dret?.[0] || jd + 0.25;
    const sunsetJd = sunsetResult?.dret?.[0] || jd + 0.75;
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
        const sweph = (0, utils_1.getNativeModule)();
        const geopos = [location.longitude, location.latitude, 0];
        const flags = isRise
            ? (sweph.SE_CALC_RISE || 1)
            : (sweph.SE_CALC_SET || 2);
        // Use civil twilight flag with custom depression
        const result = sweph.swe_rise_trans(jd, types_1.PlanetId.SUN, 0, flags | (sweph.SE_BIT_CIVIL_TWILIGHT || 0x100), geopos, 0, 0);
        if (result?.dret?.[0]) {
            return (0, utils_1.julianToDate)(result.dret[0], timezone);
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
//# sourceMappingURL=sun.js.map