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
exports.callRiseTrans = callRiseTrans;
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
// Native module instance
let sweph = null;
let ephemerisPath = null;
let isInitialized = false;
/**
 * Get the native Swiss Ephemeris module
 * Automatically loads pre-built binaries or falls back to swisseph-v2
 * @returns Swiss Ephemeris native module instance
 * @throws Error if no compatible native module can be loaded
 * @internal
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
 * Initialize the Swiss Ephemeris system
 * Automatically locates and sets the ephemeris data file path
 * Searches in common locations: ./ephe, ../ephe, etc.
 * @throws Error if ephemeris files cannot be found
 * @internal
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
 * Set custom path to Swiss Ephemeris data files
 * @param path - Directory path containing ephemeris files (.se1 files)
 * @example
 * ```typescript
 * // Set custom ephemeris path
 * setEphemerisPath('/path/to/ephemeris/files');
 *
 * // Then initialize
 * initializeSweph();
 * ```
 */
function setEphemerisPath(path) {
    ephemerisPath = path;
    if (sweph) {
        sweph.swe_set_ephe_path(path);
    }
}
/**
 * Get the ayanamsa correction value for sidereal calculations
 * @param date - Date for ayanamsa calculation
 * @param ayanamsaType - Ayanamsa system identifier (default: 1 = Lahiri)
 * @returns Ayanamsa value in degrees to subtract from tropical longitude
 * @example
 * ```typescript
 * import { AYANAMSA } from '@AstroFusion/sweph';
 *
 * const ayanamsa = getAyanamsa(new Date(), AYANAMSA.LAHIRI);
 * console.log(`Lahiri ayanamsa: ${ayanamsa.toFixed(4)}°`);
 * ```
 */
function getAyanamsa(date, ayanamsaType = 1) {
    initializeSweph();
    const sweph = getNativeModule();
    const jd = dateToJulian(date);
    sweph.swe_set_sid_mode(ayanamsaType, 0, 0);
    return sweph.swe_get_ayanamsa(jd);
}
/**
 * Convert JavaScript Date to Julian Day number
 * @param date - JavaScript Date object
 * @returns Julian Day number (days since J2000 epoch)
 * @example
 * ```typescript
 * const jd = dateToJulian(new Date('2024-01-01'));
 * console.log(`Julian Day: ${jd}`); // ~2460311.5
 * ```
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
 * Convert Julian Day number to JavaScript Date
 * @param jd - Julian Day number
 * @param timezoneOffset - Timezone offset in hours (e.g., 5.5 for IST)
 * @returns JavaScript Date object
 * @example
 * ```typescript
 * const date = julianToDate(2460311.5, 5.5); // IST timezone
 * console.log(date.toISOString()); // 2024-01-01T00:00:00.000Z (adjusted)
 * ```
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
 * Normalize ecliptic longitude to 0-360° range
 * @param longitude - Longitude value (can be any number)
 * @returns Normalized longitude between 0° and 360°
 * @example
 * ```typescript
 * normalizeLongitude(370);  // 10
 * normalizeLongitude(-10);  // 350
 * normalizeLongitude(360);  // 0
 * ```
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
 * @param longitude - Ecliptic longitude in degrees
 * @returns Object containing nakshatra number (1-27) and pada (1-4)
 * @example
 * ```typescript
 * const nakshatra = getNakshatra(45.5);
 * console.log(`Nakshatra ${nakshatra.number}, Pada ${nakshatra.pada}`);
 * // Output: Nakshatra 4, Pada 1 (Ardra)
 * ```
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
/**
 * Helper to call swe_rise_trans with fallback for different signatures
 * Provides compatibility with different versions of swisseph-v2 library
 * @param jd - Julian day number
 * @param id - Planet/celestial body identifier
 * @param flag - Rise/set calculation flag
 * @param location - Geographic location coordinates
 * @returns Result of swe_rise_trans call
 * @internal
 */
function callRiseTrans(jd, id, flag, location) {
    const sweph = getNativeModule();
    const SEFLG_SWIEPH = sweph.SEFLG_SWIEPH || 2;
    try {
        // Try flat arguments first (swisseph-v2 style)
        return sweph.swe_rise_trans(jd, id, '', SEFLG_SWIEPH, flag, location.longitude, location.latitude, 0, 0, 0);
    }
    catch (error) {
        if (error && error.message && error.message.includes('Wrong type of arguments')) {
            // Try array argument for geopos (standard swisseph style)
            return sweph.swe_rise_trans(jd, id, '', SEFLG_SWIEPH, flag, [location.longitude, location.latitude, 0], 0, 0);
        }
        throw error;
    }
}
//# sourceMappingURL=utils.js.map