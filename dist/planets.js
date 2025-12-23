"use strict";
/**
 * Planet Calculations for @AstroFusion/sweph
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePlanets = calculatePlanets;
exports.calculateSinglePlanet = calculateSinglePlanet;
exports.calculatePlanetRiseSetTimes = calculatePlanetRiseSetTimes;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
/**
 * Calculate positions for all 9 Vedic planets
 * @param date - Date for calculation
 * @param options - Calculation options (ayanamsa, etc.)
 * @returns Array of planet positions
 */
function calculatePlanets(date, options = {}) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const { ayanamsa = 1, includeSpeed = true } = options;
    // Set sidereal mode with specified ayanamsa
    sweph.swe_set_sid_mode(ayanamsa, 0, 0);
    const jd = (0, utils_1.dateToJulian)(date);
    const planets = [];
    // Build calculation flags
    let flags = constants_1.CALC_FLAGS.SIDEREAL | constants_1.CALC_FLAGS.SWIEPH;
    if (includeSpeed)
        flags |= constants_1.CALC_FLAGS.SPEED;
    let rahuLongitude = null;
    let rahuSpeed = null;
    for (const planetDef of constants_1.VEDIC_PLANET_ORDER) {
        // Ketu is calculated as 180° from Rahu
        if (planetDef.name === 'Ketu') {
            if (rahuLongitude !== null) {
                const ketuLongitude = (0, utils_1.normalizeLongitude)(rahuLongitude + 180);
                const ketuSpeed = rahuSpeed !== null ? -rahuSpeed : 0;
                planets.push({
                    id: 'ketu',
                    name: 'Ketu',
                    longitude: ketuLongitude,
                    latitude: 0,
                    distance: 0,
                    speed: ketuSpeed,
                    rasi: (0, utils_1.getRashi)(ketuLongitude),
                    rasiDegree: (0, utils_1.getRashiDegree)(ketuLongitude),
                    isRetrograde: true, // Ketu is always retrograde
                    totalDegree: ketuLongitude, // Legacy compatibility
                });
            }
            continue;
        }
        // Calculate planet position
        const result = sweph.swe_calc_ut(jd, planetDef.id, flags);
        if (result && typeof result === 'object') {
            let longitude = 0;
            let latitude = 0;
            let distance = 0;
            let speed = 0;
            // Handle different result formats from swisseph-v2
            if (Array.isArray(result)) {
                longitude = result[0] || 0;
                latitude = result[1] || 0;
                distance = result[2] || 0;
                speed = result[3] || 0;
            }
            else if (result.xx && Array.isArray(result.xx)) {
                longitude = result.xx[0] || 0;
                latitude = result.xx[1] || 0;
                distance = result.xx[2] || 0;
                speed = result.xx[3] || 0;
            }
            else if ('longitude' in result) {
                longitude = result.longitude;
                latitude = result.latitude || 0;
                distance = result.distance || 0;
                speed = result.longitudeSpeed || result.speed || 0;
            }
            const normalizedLong = (0, utils_1.normalizeLongitude)(longitude);
            // Store Rahu's position for Ketu calculation
            if (planetDef.name === 'Rahu') {
                rahuLongitude = normalizedLong;
                rahuSpeed = speed;
            }
            planets.push({
                id: planetDef.name.toLowerCase(),
                name: planetDef.name,
                longitude: normalizedLong,
                latitude,
                distance,
                speed,
                rasi: (0, utils_1.getRashi)(normalizedLong),
                rasiDegree: (0, utils_1.getRashiDegree)(normalizedLong),
                isRetrograde: (0, utils_1.isRetrograde)(speed),
                totalDegree: normalizedLong, // Legacy compatibility
            });
        }
    }
    return planets;
}
/**
 * Calculate position for a single planet
 * @param planetId - Swiss Ephemeris planet ID
 * @param date - Date for calculation
 * @param options - Calculation options
 * @returns Planet position or null if calculation fails
 */
function calculateSinglePlanet(planetId, date, options = {}) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const { ayanamsa = 1, includeSpeed = true } = options;
    sweph.swe_set_sid_mode(ayanamsa, 0, 0);
    const jd = (0, utils_1.dateToJulian)(date);
    let flags = constants_1.CALC_FLAGS.SIDEREAL | constants_1.CALC_FLAGS.SWIEPH;
    if (includeSpeed)
        flags |= constants_1.CALC_FLAGS.SPEED;
    const result = sweph.swe_calc_ut(jd, planetId, flags);
    if (!result || typeof result !== 'object') {
        return null;
    }
    let longitude = 0;
    let latitude = 0;
    let distance = 0;
    let speed = 0;
    if (Array.isArray(result)) {
        longitude = result[0] || 0;
        latitude = result[1] || 0;
        distance = result[2] || 0;
        speed = result[3] || 0;
    }
    else if (result.xx && Array.isArray(result.xx)) {
        longitude = result.xx[0] || 0;
        latitude = result.xx[1] || 0;
        distance = result.xx[2] || 0;
        speed = result.xx[3] || 0;
    }
    const normalizedLong = (0, utils_1.normalizeLongitude)(longitude);
    // Get planet name from sweph
    const planetName = sweph.swe_get_planet_name(planetId) || `Planet ${planetId}`;
    return {
        id: planetId.toString(),
        name: planetName,
        longitude: normalizedLong,
        latitude,
        distance,
        speed,
        rasi: (0, utils_1.getRashi)(normalizedLong),
        rasiDegree: (0, utils_1.getRashiDegree)(normalizedLong),
        isRetrograde: (0, utils_1.isRetrograde)(speed),
        totalDegree: normalizedLong, // Legacy compatibility
    };
}
/**
 * Calculate rise and set times for a planet
 * @param planetId - Swiss Ephemeris planet ID
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Rise and set times
 */
function calculatePlanetRiseSetTimes(planetId, date, location) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const timezone = location.timezone ?? 0;
    // Convert to UTC midnight
    const utcDate = new Date(date.getTime() - timezone * 60 * 60 * 1000);
    utcDate.setUTCHours(0, 0, 0, 0);
    const jd = (0, utils_1.dateToJulian)(utcDate);
    const geopos = [location.longitude, location.latitude, 0];
    const CALC_RISE = sweph.SE_CALC_RISE || 1;
    const CALC_SET = sweph.SE_CALC_SET || 2;
    // Calculate rise
    const riseResult = sweph.swe_rise_trans(jd, planetId, 0, CALC_RISE, geopos, 0, 0);
    // Calculate set
    const setResult = sweph.swe_rise_trans(jd, planetId, 0, CALC_SET, geopos, 0, 0);
    const rise = riseResult?.dret?.[0]
        ? (0, utils_1.julianToDate)(riseResult.dret[0], timezone)
        : null;
    const set = setResult?.dret?.[0]
        ? (0, utils_1.julianToDate)(setResult.dret[0], timezone)
        : null;
    return { rise, set };
}
//# sourceMappingURL=planets.js.map