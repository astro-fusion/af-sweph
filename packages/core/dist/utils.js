"use strict";
/**
 * @af/sweph-core - Pure Utility Functions
 *
 * Platform-agnostic calculation utilities.
 * These functions have no dependencies on native modules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLongitude = normalizeLongitude;
exports.getRashi = getRashi;
exports.getRashiDegree = getRashiDegree;
exports.isRetrograde = isRetrograde;
exports.getNakshatra = getNakshatra;
exports.julianToDate = julianToDate;
exports.getMoonPhaseName = getMoonPhaseName;
exports.degreesToDMS = degreesToDMS;
exports.formatLongitude = formatLongitude;
const constants_1 = require("./constants");
/**
 * Normalize ecliptic longitude to 0-360° range
 */
function normalizeLongitude(longitude) {
    let norm = longitude % 360;
    if (norm < 0)
        norm += 360;
    return norm;
}
/**
 * Get rashi (zodiac sign) from longitude
 * @returns Rashi number 1-12
 */
function getRashi(longitude) {
    return Math.floor(normalizeLongitude(longitude) / 30) + 1;
}
/**
 * Get degree within rashi from longitude
 * @returns Degree 0-30
 */
function getRashiDegree(longitude) {
    return normalizeLongitude(longitude) % 30;
}
/**
 * Calculate if a planet is retrograde based on speed
 */
function isRetrograde(speed) {
    return speed < 0;
}
/**
 * Calculate nakshatra (lunar mansion) from ecliptic longitude
 * @returns Object containing nakshatra number (1-27) and pada (1-4)
 */
function getNakshatra(longitude) {
    const norm = normalizeLongitude(longitude);
    const nakshatraSpan = 360 / 27;
    const padaSpan = nakshatraSpan / 4;
    const nakshatraNumber = Math.floor(norm / nakshatraSpan) + 1;
    const positionInNakshatra = norm % nakshatraSpan;
    const pada = Math.floor(positionInNakshatra / padaSpan) + 1;
    return { number: nakshatraNumber, pada };
}
/**
 * Convert Julian Day number to JavaScript Date (pure JS, no native dependency)
 */
function julianToDate(jd, timezoneOffset = 0) {
    const utcMs = (jd - constants_1.JULIAN_UNIX_EPOCH) * 86400000;
    return new Date(utcMs + timezoneOffset * 60 * 60 * 1000);
}
/**
 * Get moon phase name from phase angle (0-360)
 */
function getMoonPhaseName(phaseAngle) {
    const normalized = normalizeLongitude(phaseAngle);
    const phaseIndex = Math.floor((normalized + 22.5) / 45) % 8;
    const phases = [
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent',
    ];
    return phases[phaseIndex] ?? 'New Moon';
}
/**
 * Calculate degrees, minutes, seconds from decimal degrees
 */
function degreesToDMS(degrees) {
    const d = Math.floor(Math.abs(degrees));
    const m = Math.floor((Math.abs(degrees) - d) * 60);
    const s = Math.round(((Math.abs(degrees) - d) * 60 - m) * 60);
    return { degrees: d * Math.sign(degrees), minutes: m, seconds: s };
}
/**
 * Format longitude to string (e.g., "15°30'45" Aries")
 */
function formatLongitude(longitude) {
    const dms = degreesToDMS(getRashiDegree(longitude));
    const rashiNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const rashi = rashiNames[getRashi(longitude) - 1];
    return `${dms.degrees}°${dms.minutes}'${dms.seconds}" ${rashi}`;
}
//# sourceMappingURL=utils.js.map