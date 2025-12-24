"use strict";
/**
 * Moon Calculations for @AstroFusion/sweph
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMoonData = calculateMoonData;
exports.calculateMoonPhase = calculateMoonPhase;
exports.calculateNextMoonPhases = calculateNextMoonPhases;
const types_1 = require("./types");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
/**
 * Calculate comprehensive moon data including rise/set times and phase
 * @param date - Date for moon calculation (local time)
 * @param location - Geographic location coordinates
 * @returns MoonData object with rise/set times, phase, and illumination
 * @example
 * ```typescript
 * const moonData = calculateMoonData(new Date(), {
 *   latitude: 27.7172,
 *   longitude: 85.324,
 *   timezone: 5.75
 * });
 *
 * console.log(`Moonrise: ${moonData.moonrise?.toLocaleTimeString()}`);
 * console.log(`Phase: ${moonData.phaseName} (${moonData.illumination.toFixed(1)}% illuminated)`);
 * ```
 */
function calculateMoonData(date, location) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const timezone = location.timezone ?? 0;
    // Convert to UTC midnight
    const utcDate = new Date(date.getTime() - timezone * 60 * 60 * 1000);
    utcDate.setUTCHours(0, 0, 0, 0);
    const jd = (0, utils_1.dateToJulian)(utcDate);
    const CALC_RISE = sweph.SE_CALC_RISE || 1;
    const CALC_SET = sweph.SE_CALC_SET || 2;
    const CALC_MTRANS = sweph.SE_CALC_MTRANS || 4; // Meridian transit flag
    // Calculate moonrise
    const moonriseResult = (0, utils_1.callRiseTrans)(jd, types_1.PlanetId.MOON, CALC_RISE, location);
    // Calculate moonset
    const moonsetResult = (0, utils_1.callRiseTrans)(jd, types_1.PlanetId.MOON, CALC_SET, location);
    // Calculate moon meridian transit (upper culmination)
    const transitResult = (0, utils_1.callRiseTrans)(jd, types_1.PlanetId.MOON, CALC_MTRANS, location);
    // swe_rise_trans returns { transitTime, name } or { error }
    const moonrise = moonriseResult?.transitTime
        ? (0, utils_1.julianToDate)(moonriseResult.transitTime, timezone)
        : moonriseResult?.dret?.[0]
            ? (0, utils_1.julianToDate)(moonriseResult.dret[0], timezone)
            : null;
    const moonset = moonsetResult?.transitTime
        ? (0, utils_1.julianToDate)(moonsetResult.transitTime, timezone)
        : moonsetResult?.dret?.[0]
            ? (0, utils_1.julianToDate)(moonsetResult.dret[0], timezone)
            : null;
    const transit = transitResult?.transitTime
        ? (0, utils_1.julianToDate)(transitResult.transitTime, timezone)
        : transitResult?.dret?.[0]
            ? (0, utils_1.julianToDate)(transitResult.dret[0], timezone)
            : null;
    // Calculate moon phase using sun-moon elongation
    const { phase, illumination, age, phaseName } = calculateMoonPhase(date);
    // Calculate moon distance
    const moonCalcResult = sweph.swe_calc_ut(jd, types_1.PlanetId.MOON, 0);
    let distance = constants_1.DEFAULT_MOON_DISTANCE_KM; // Default average Earth-Moon distance in km
    if (moonCalcResult) {
        const resultPayload = Array.isArray(moonCalcResult) ? moonCalcResult : moonCalcResult.xx;
        const distanceAU = resultPayload?.[2] || 0;
        if (distanceAU > 0) {
            // Convert AU to km
            distance = distanceAU * constants_1.AU_IN_KM;
        }
    }
    return {
        moonrise,
        moonset,
        transit,
        phase,
        illumination,
        age,
        phaseName,
        distance,
    };
}
/**
 * Calculate current moon phase
 * @param date - Date for calculation
 * @returns Moon phase information
 */
function calculateMoonPhase(date) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const jd = (0, utils_1.dateToJulian)(date);
    // Calculate sun and moon positions (tropical)
    const sunResult = sweph.swe_calc_ut(jd, types_1.PlanetId.SUN, 0);
    const moonResult = sweph.swe_calc_ut(jd, types_1.PlanetId.MOON, 0);
    let sunLong = 0;
    let moonLong = 0;
    if (Array.isArray(sunResult)) {
        sunLong = sunResult[0] || 0;
    }
    else if (sunResult?.xx) {
        sunLong = sunResult.xx[0] || 0;
    }
    if (Array.isArray(moonResult)) {
        moonLong = moonResult[0] || 0;
    }
    else if (moonResult?.xx) {
        moonLong = moonResult.xx[0] || 0;
    }
    // Phase angle is Moon - Sun (0-360)
    let phase = moonLong - sunLong;
    if (phase < 0)
        phase += 360;
    // Illumination percentage (0% at new moon, 100% at full moon)
    const illumination = ((1 - Math.cos(phase * Math.PI / 180)) / 2) * 100;
    // Moon age in days (0 = new moon)
    const age = phase / (360 / constants_1.LUNAR_MONTH_DAYS);
    // Determine phase name
    const phaseIndex = Math.floor(phase / 45);
    const phaseName = constants_1.MOON_PHASES[phaseIndex] || constants_1.MOON_PHASES[0];
    return { phase, illumination, age, phaseName };
}
/**
 * Calculate dates of next moon phases
 * @param date - Starting date
 * @returns Dates of upcoming moon phases
 */
function calculateNextMoonPhases(date) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const jd = (0, utils_1.dateToJulian)(date);
    // Get current phase
    const { phase: currentPhase } = calculateMoonPhase(date);
    // Calculate days until each phase
    // New Moon = 0°, First Quarter = 90°, Full Moon = 180°, Last Quarter = 270°
    const phases = [
        { name: 'newMoon', angle: 0 },
        { name: 'firstQuarter', angle: 90 },
        { name: 'fullMoon', angle: 180 },
        { name: 'lastQuarter', angle: 270 },
    ];
    const result = {};
    for (const phase of phases) {
        // Calculate degrees until this phase
        let degreesUntil = phase.angle - currentPhase;
        if (degreesUntil <= 0)
            degreesUntil += 360;
        // Convert to days (360° = ~29.53 days)
        const daysUntil = degreesUntil / (360 / constants_1.LUNAR_MONTH_DAYS);
        // Calculate the date
        const phaseDate = new Date(date.getTime() + daysUntil * 24 * 60 * 60 * 1000);
        result[phase.name] = phaseDate;
    }
    return {
        newMoon: result.newMoon,
        firstQuarter: result.firstQuarter,
        fullMoon: result.fullMoon,
        lastQuarter: result.lastQuarter,
    };
}
//# sourceMappingURL=moon.js.map