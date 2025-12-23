"use strict";
/**
 * Utility Functions for @AstroFusion/sweph
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNativeModule = getNativeModule;
exports.initializeSweph = initializeSweph;
exports.setEphemerisPath = setEphemerisPath;
exports.getAyanamsa = getAyanamsa;
exports.dateToJulian = dateToJulian;
exports.julianToDate = julianToDate;
exports.getJulianDay = getJulianDay;
exports.normalizeLongitude = normalizeLongitude;
exports.getRashi = getRashi;
exports.getRashiDegree = getRashiDegree;
exports.isRetrograde = isRetrograde;
exports.getNakshatra = getNakshatra;
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
// Native module instance
let sweph = null;
let ephemerisPath = null;
let isInitialized = false;
/**
 * Get the native Swiss Ephemeris module
 * Uses node-gyp-build to load pre-built binaries
 */
function getNativeModule() {
    if (!sweph) {
        try {
            // Try to load pre-built binary first
            const gypBuild = require('node-gyp-build');
            sweph = gypBuild(path_1.default.resolve(__dirname, '..'));
        }
        catch {
            // Fall back to direct require of swisseph-v2 if prebuilds not available
            // This allows development without prebuilds
            try {
                const swissephV2 = require('swisseph-v2');
                sweph = swissephV2.default || swissephV2;
            }
            catch (e) {
                throw new Error('Failed to load Swiss Ephemeris native module. ' +
                    'Make sure swisseph-v2 is installed or prebuilds are available. ' +
                    `Error: ${e}`);
            }
        }
    }
    return sweph;
}
/**
 * Initialize the Swiss Ephemeris
 * Automatically finds and sets ephemeris path
 */
function initializeSweph() {
    if (isInitialized)
        return;
    const sweph = getNativeModule();
    // Try to find ephemeris files
    const searchPaths = [
        ephemerisPath,
        path_1.default.resolve(__dirname, '..', 'ephe'),
        path_1.default.resolve(process.cwd(), 'ephe'),
        path_1.default.resolve(process.cwd(), 'lib', 'ephe'),
        path_1.default.resolve(process.cwd(), 'public', 'ephe'),
    ].filter(Boolean);
    for (const ephePath of searchPaths) {
        try {
            const fs = require('fs');
            if (fs.existsSync(ephePath)) {
                sweph.swe_set_ephe_path(ephePath);
                ephemerisPath = ephePath;
                break;
            }
        }
        catch {
            // Ignore and try next path
        }
    }
    isInitialized = true;
}
/**
 * Set custom ephemeris file path
 */
function setEphemerisPath(path) {
    ephemerisPath = path;
    if (sweph) {
        sweph.swe_set_ephe_path(path);
    }
}
/**
 * Get the current ayanamsa value
 * @param date - Date for calculation
 * @param ayanamsaType - Ayanamsa system (default: Lahiri = 1)
 */
function getAyanamsa(date, ayanamsaType = 1) {
    initializeSweph();
    const sweph = getNativeModule();
    const jd = dateToJulian(date);
    sweph.swe_set_sid_mode(ayanamsaType, 0, 0);
    return sweph.swe_get_ayanamsa(jd);
}
/**
 * Convert Date to Julian Day number
 */
function dateToJulian(date) {
    const sweph = getNativeModule();
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() +
        date.getUTCMinutes() / 60 +
        date.getUTCSeconds() / 3600;
    // Use Gregorian calendar (1)
    return sweph.swe_julday(year, month, day, hour, 1);
}
/**
 * Convert Julian Day to Date
 */
function julianToDate(jd, timezoneOffset = 0) {
    const utcMs = (jd - constants_1.JULIAN_UNIX_EPOCH) * 86400000;
    return new Date(utcMs + timezoneOffset * 60 * 60 * 1000);
}
/**
 * Get Julian Day for a date (alias for dateToJulian)
 */
function getJulianDay(date) {
    return dateToJulian(date);
}
/**
 * Normalize longitude to 0-360 range
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
 * Get nakshatra from longitude
 * @returns Object with nakshatra number (1-27) and pada (1-4)
 */
function getNakshatra(longitude) {
    const norm = normalizeLongitude(longitude);
    const nakshatraSpan = 360 / 27; // 13.333... degrees each
    const padaSpan = nakshatraSpan / 4; // ~3.333 degrees each
    const nakshatraNumber = Math.floor(norm / nakshatraSpan) + 1;
    const positionInNakshatra = norm % nakshatraSpan;
    const pada = Math.floor(positionInNakshatra / padaSpan) + 1;
    return { number: nakshatraNumber, pada };
}
//# sourceMappingURL=utils.js.map