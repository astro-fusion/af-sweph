"use strict";
/**
 * Utility Functions for @af/sweph-node
 *
 * This module provides shared utility functions for astronomical calculations.
 * It lazily loads the native module to prevent webpack bundling issues.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLongitude = exports.julianToDate = exports.getNakshatra = exports.isRetrograde = exports.getRashiDegree = exports.getRashi = exports.normalizeLongitude = void 0;
exports.getPlanetCacheKey = getPlanetCacheKey;
exports.getSunCacheKey = getSunCacheKey;
exports.getMoonCacheKey = getMoonCacheKey;
exports.getLagnaCacheKey = getLagnaCacheKey;
exports.clearAllCaches = clearAllCaches;
exports.setCachingEnabled = setCachingEnabled;
exports.getNativeModule = getNativeModule;
exports.initializeSweph = initializeSweph;
exports.setEphemerisPath = setEphemerisPath;
exports.getAyanamsa = getAyanamsa;
exports.dateToJulian = dateToJulian;
exports.getJulianDay = getJulianDay;
exports.callRiseTrans = callRiseTrans;
exports.callAzAlt = callAzAlt;
const path_1 = __importDefault(require("path"));
const native_loader_1 = require("./native-loader");
// Re-export pure utilities from core
var sweph_core_1 = require("@af/sweph-core");
Object.defineProperty(exports, "normalizeLongitude", { enumerable: true, get: function () { return sweph_core_1.normalizeLongitude; } });
Object.defineProperty(exports, "getRashi", { enumerable: true, get: function () { return sweph_core_1.getRashi; } });
Object.defineProperty(exports, "getRashiDegree", { enumerable: true, get: function () { return sweph_core_1.getRashiDegree; } });
Object.defineProperty(exports, "isRetrograde", { enumerable: true, get: function () { return sweph_core_1.isRetrograde; } });
Object.defineProperty(exports, "getNakshatra", { enumerable: true, get: function () { return sweph_core_1.getNakshatra; } });
Object.defineProperty(exports, "julianToDate", { enumerable: true, get: function () { return sweph_core_1.julianToDate; } });
Object.defineProperty(exports, "formatLongitude", { enumerable: true, get: function () { return sweph_core_1.formatLongitude; } });
// Ephemeris path and initialization state
let ephemerisPath = null;
let isInitialized = false;
let cachedNativeModule = null;
class ServerlessCache {
    cache = new Map();
    maxSize;
    defaultTTL;
    enabled;
    constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) {
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.enabled = process.env.SWEPH_DISABLE_CACHE !== 'true';
    }
    set(key, value, ttl) {
        if (!this.enabled)
            return;
        // Simple LRU eviction
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl: ttl ?? this.defaultTTL
        });
    }
    get(key) {
        if (!this.enabled)
            return undefined;
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }
    clear() {
        this.cache.clear();
    }
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }
}
// Global cache instances for different calculation types
const planetCache = new ServerlessCache();
const sunCache = new ServerlessCache();
const moonCache = new ServerlessCache();
const lagnaCache = new ServerlessCache();
/**
 * Generate cache key for planetary calculations
 */
function getPlanetCacheKey(date, options) {
    return `planet_${date.getTime()}_${JSON.stringify(options)}`;
}
/**
 * Generate cache key for sun calculations
 */
function getSunCacheKey(date, location) {
    return `sun_${date.getTime()}_${location ? `${location.latitude}_${location.longitude}` : 'global'}`;
}
/**
 * Generate cache key for moon calculations
 */
function getMoonCacheKey(date) {
    return `moon_${date.getTime()}`;
}
/**
 * Generate cache key for lagna calculations
 */
function getLagnaCacheKey(date, location, options) {
    return `lagna_${date.getTime()}_${location.latitude}_${location.longitude}_${JSON.stringify(options)}`;
}
/**
 * Clear all caches (useful for memory management in serverless)
 */
function clearAllCaches() {
    planetCache.clear();
    sunCache.clear();
    moonCache.clear();
    lagnaCache.clear();
}
/**
 * Enable/disable caching globally
 */
function setCachingEnabled(enabled) {
    planetCache.setEnabled(enabled);
    sunCache.setEnabled(enabled);
    moonCache.setEnabled(enabled);
    lagnaCache.setEnabled(enabled);
}
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
 * @throws Error if initialization fails
 */
async function initializeSweph(options) {
    if (isInitialized && cachedNativeModule)
        return;
    cachedNativeModule = await (0, native_loader_1.loadNativeBinary)(options);
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
 */
function getAyanamsa(date, ayanamsaType = 1) {
    const sweph = getNativeModule();
    const jd = dateToJulian(date);
    sweph.swe_set_sid_mode(ayanamsaType, 0, 0);
    return sweph.swe_get_ayanamsa(jd);
}
/**
 * Convert JavaScript Date to Julian Day number
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
 * Get Julian Day for a date (alias for dateToJulian)
 */
function getJulianDay(date) {
    return dateToJulian(date);
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
    throw new Error(`swe_azalt call failed after multiple attempts. Errors: ${errors.join('; ')}`);
}
//# sourceMappingURL=utils.js.map