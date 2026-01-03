"use strict";
/**
 * Utility Functions for @AstroFusion/sweph
 *
 * This module provides shared utility functions for astronomical calculations.
 * It lazily loads the native module to prevent webpack bundling issues.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.callAzAlt = callAzAlt;
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
// Ephemeris path and initialization state
let ephemerisPath = null;
let isInitialized = false;
let cachedNativeModule = null;
// Simple browser detection
const isBrowser = typeof globalThis.window !== 'undefined' && typeof globalThis.window.document !== 'undefined';
/**
 * Get the native Swiss Ephemeris module
 * Uses lazy loading to prevent webpack from bundling native modules
 *
 * @returns Swiss Ephemeris native module instance
 * @throws Error if module not initialized
 * @internal
 */
function getNativeModule() {
    if (!cachedNativeModule) {
        throw new Error('Swiss Ephemeris module not initialized. ' +
            'Call await initializeSweph() before using calculation functions.');
    }
    return cachedNativeModule;
}
/**
 * Initialize the Swiss Ephemeris system
 * Must be called (and awaited) before using any calculation functions
 *
 * @param options - Optional configuration
 * @param options.wasmUrl - Custom URL for WASM file (browser only)
 * @throws Error if initialization fails
 *
 * @example
 * ```typescript
 * // Initialize before using
 * await initializeSweph();
 *
 * // Now you can use calculation functions
 * const planets = calculatePlanets(new Date());
 * ```
 */
async function initializeSweph(options) {
    if (isInitialized && cachedNativeModule)
        return;
    // Dynamically import the appropriate loader based on environment
    // This prevents webpack from bundling both loaders
    if (isBrowser) {
        const { loadNativeBinary } = await Promise.resolve().then(() => __importStar(require('./browser-loader')));
        cachedNativeModule = await loadNativeBinary(options);
    }
    else {
        const { loadNativeBinary } = await Promise.resolve().then(() => __importStar(require('./native-loader')));
        cachedNativeModule = await loadNativeBinary(options);
        // Try to find ephemeris files (Node only)
        const searchPaths = [
            ephemerisPath,
            path_1.default.resolve(__dirname, '..', 'ephe'),
            path_1.default.resolve(process.cwd(), 'ephe'),
            path_1.default.resolve(process.cwd(), 'lib', 'ephe'),
            path_1.default.resolve(process.cwd(), 'public', 'ephe'),
        ].filter(Boolean);
        for (const ephePath of searchPaths) {
            try {
                // Dynamic require for fs to avoid webpack bundling
                const dynamicRequire = new Function('moduleName', 'return require(moduleName)');
                const fs = dynamicRequire('fs');
                if (fs.existsSync(ephePath)) {
                    cachedNativeModule.swe_set_ephe_path(ephePath);
                    ephemerisPath = ephePath;
                    break;
                }
            }
            catch {
                // Ignore and try next path
            }
        }
    }
    isInitialized = true;
}
/**
 * Set custom path to Swiss Ephemeris data files
 * @param customPath - Directory path containing ephemeris files (.se1 files)
 */
function setEphemerisPath(customPath) {
    ephemerisPath = customPath;
    if (cachedNativeModule) {
        try {
            cachedNativeModule.swe_set_ephe_path(customPath);
        }
        catch {
            // Module might not support this method in all environments
        }
    }
}
/**
 * Get the ayanamsa correction value for sidereal calculations
 *
 * @param date - The date for which to calculate ayanamsa
 * @param ayanamsaType - The ayanamsa system to use (default: 1 for Lahiri)
 * @returns The ayanamsa correction value in degrees
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-01');
 * const ayanamsa = getAyanamsa(date, 1); // Lahiri ayanamsa
 * console.log(`Lahiri ayanamsa: ${ayanamsa.toFixed(4)}°`);
 * ```
 */
function getAyanamsa(date, ayanamsaType = 1) {
    const sweph = getNativeModule();
    const jd = dateToJulian(date);
    sweph.swe_set_sid_mode(ayanamsaType, 0, 0);
    return sweph.swe_get_ayanamsa(jd);
}
/**
 * Convert JavaScript Date to Julian Day number
 *
 * @param date - The date to convert (UTC)
 * @returns The Julian Day number for the given date
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-01T12:00:00Z');
 * const jd = dateToJulian(date);
 * console.log(`Julian Day: ${jd}`); // 2460311.0
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
    return sweph.swe_julday(year, month, day, hour, 1);
}
/**
 * Convert Julian Day number to JavaScript Date
 *
 * @param jd - The Julian Day number to convert
 * @param timezoneOffset - Timezone offset in hours from UTC (default: 0)
 * @returns JavaScript Date object
 *
 * @example
 * ```typescript
 * const jd = 2460311.0;
 * const date = julianToDate(jd);
 * console.log(date.toISOString()); // 2024-01-01T12:00:00.000Z
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
 *
 * @param longitude - Longitude value in degrees (can be any real number)
 * @returns Normalized longitude between 0 and 360 degrees
 *
 * @example
 * ```typescript
 * normalizeLongitude(390);  // 30
 * normalizeLongitude(-30);  // 330
 * normalizeLongitude(180);  // 180
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
 *
 * @param longitude - Ecliptic longitude in degrees
 * @returns Object containing nakshatra number (1-27) and pada (1-4)
 *
 * @example
 * ```typescript
 * const result = getNakshatra(30);
 * console.log(`Nakshatra: ${result.number}, Pada: ${result.pada}`);
 * // Nakshatra: 2, Pada: 1 (for longitude 30°)
 * ```
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
 * Helper to call swe_rise_trans with fallback for different signatures
 * @internal
 */
function callRiseTrans(jd, id, flag, location) {
    const sweph = getNativeModule();
    const SEFLG_SWIEPH = sweph.SEFLG_SWIEPH || 2;
    try {
        return sweph.swe_rise_trans(jd, id, '', SEFLG_SWIEPH, flag, location.longitude, location.latitude, 0, 0, 0);
    }
    catch (error) {
        if (error && error.message && error.message.includes('Wrong type of arguments')) {
            return sweph.swe_rise_trans(jd, id, '', SEFLG_SWIEPH, flag, [location.longitude, location.latitude, 0], 0, 0);
        }
        throw error;
    }
}
/**
 * Helper to call swe_azalt with fallback for different signatures
 * @internal
 */
function callAzAlt(jd, location, planetPos) {
    const sweph = getNativeModule();
    const geopos = [location.longitude, location.latitude, 0];
    const xin = [planetPos.longitude, planetPos.latitude, planetPos.distance];
    const errors = [];
    try {
        return sweph.swe_azalt(jd, sweph.SE_EQU2HOR || 0x0800, geopos, 0, 10, xin);
    }
    catch (error) {
        errors.push(`Attempt 1 failed: ${error.message}`);
    }
    try {
        return sweph.swe_azalt(jd, geopos, xin);
    }
    catch (error) {
        errors.push(`Attempt 2 failed: ${error.message}`);
    }
    try {
        return sweph.swe_azalt(jd, sweph.SE_EQU2HOR || 0x0800, location.longitude, location.latitude, 0, 0, 10, planetPos.longitude, planetPos.latitude, planetPos.distance);
    }
    catch (error) {
        errors.push(`Attempt 3 failed: ${error.message}`);
    }
    console.warn('swe_azalt call failed. Errors:', errors.join('; '));
    throw new Error(`swe_azalt call failed. Errors: ${errors.join('; ')}`);
}
//# sourceMappingURL=utils.js.map