import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Utility Functions for @AstroFusion/sweph
 */
import path from 'path';
import { JULIAN_UNIX_EPOCH } from './constants';
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
export function getNativeModule() {
    if (!sweph) {
        try {
            // Try to load pre-built binary first
            const gypBuild = require('node-gyp-build');
            sweph = gypBuild(path.resolve(__dirname, '..'));
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
export function initializeSweph() {
    if (isInitialized)
        return;
    const sweph = getNativeModule();
    // Try to find ephemeris files
    const searchPaths = [
        ephemerisPath,
        path.resolve(__dirname, '..', 'ephe'),
        path.resolve(process.cwd(), 'ephe'),
        path.resolve(process.cwd(), 'lib', 'ephe'),
        path.resolve(process.cwd(), 'public', 'ephe'),
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
export function setEphemerisPath(path) {
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
export function getAyanamsa(date, ayanamsaType = 1) {
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
export function dateToJulian(date) {
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
export function julianToDate(jd, timezoneOffset = 0) {
    const utcMs = (jd - JULIAN_UNIX_EPOCH) * 86400000;
    return new Date(utcMs + timezoneOffset * 60 * 60 * 1000);
}
/**
 * Get Julian Day for a date (alias for dateToJulian)
 */
export function getJulianDay(date) {
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
export function normalizeLongitude(longitude) {
    let norm = longitude % 360;
    if (norm < 0)
        norm += 360;
    return norm;
}
/**
 * Get rashi (zodiac sign) from longitude
 * @returns Rashi number 1-12
 */
export function getRashi(longitude) {
    return Math.floor(normalizeLongitude(longitude) / 30) + 1;
}
/**
 * Get degree within rashi from longitude
 * @returns Degree 0-30
 */
export function getRashiDegree(longitude) {
    return normalizeLongitude(longitude) % 30;
}
/**
 * Calculate if a planet is retrograde based on speed
 */
export function isRetrograde(speed) {
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
export function getNakshatra(longitude) {
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
export function callRiseTrans(jd, id, flag, location) {
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
/**
 * Helper to call swe_azalt with fallback for different signatures
 * Provides compatibility with different versions of swisseph-v2 library
 * @param jd - Julian day number
 * @param location - Geographic location coordinates
 * @param planetPos - Celestial body position in ecliptic coordinates
 * @returns Result of swe_azalt call
 * @internal
 */
export function callAzAlt(jd, location, planetPos) {
    const sweph = getNativeModule();
    const geopos = [location.longitude, location.latitude, 0];
    const xin = [planetPos.longitude, planetPos.latitude, planetPos.distance];
    const errors = [];
    // Attempt 1: Standard swisseph arguments with all parameters
    try {
        return sweph.swe_azalt(jd, sweph.SE_EQU2HOR || 0x0800, // Flag to convert equatorial to horizontal
        geopos, 0, // Pressure (0 = default 1013.25 mbar)
        10, // Temperature (10C)
        xin);
    }
    catch (error) {
        errors.push(`Attempt 1 failed: ${error.message}`);
    }
    // Attempt 2: Fewer parameters
    try {
        return sweph.swe_azalt(jd, geopos, xin);
    }
    catch (error) {
        errors.push(`Attempt 2 failed: ${error.message}`);
    }
    // Attempt 3: Flat arguments
    try {
        return sweph.swe_azalt(jd, sweph.SE_EQU2HOR || 0x0800, location.longitude, location.latitude, 0, 0, 10, planetPos.longitude, planetPos.latitude, planetPos.distance);
    }
    catch (error) {
        errors.push(`Attempt 3 failed: ${error.message}`);
    }
    // All attempts failed
    console.warn('swe_azalt call failed. All attempts failed. Errors:', errors.join('; '));
    // Consider returning null or throwing an error to signal failure explicitly
    return { azimuth: 0, altitude: 0 };
}
//# sourceMappingURL=utils.js.map