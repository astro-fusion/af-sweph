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
 * Calculate azimuth and altitude for a celestial body
 * @param sweph - Swiss Ephemeris native module instance
 * @param jd - Julian day number
 * @param location - Geographic location for calculation
 * @param planetPos - Planet position in ecliptic coordinates
 * @returns Object containing azimuth (degrees from North) and altitude (degrees above horizon)
 * @internal
 */
function calculateAzAlt(jd, location, planetPos) {
    const result = (0, utils_1.callAzAlt)(jd, location, planetPos);
    return {
        azimuth: result.azimuth || result[0] || 0,
        altitude: result.altitude || result[1] || 0
    };
}
/**
 * Check if a planet is combust (too close to the Sun to be visible)
 * @param planetId - Planet name identifier
 * @param planetLong - Planet's ecliptic longitude in degrees
 * @param sunLong - Sun's ecliptic longitude in degrees
 * @returns true if planet is combust, false otherwise
 * @internal
 */
function checkCombustion(planetId, planetLong, sunLong) {
    if (planetId === 'Sun' || planetId === 'Rahu' || planetId === 'Ketu')
        return false;
    // Calculate distance
    let diff = Math.abs(planetLong - sunLong);
    if (diff > 180)
        diff = 360 - diff;
    // Combustion limits (approximate standard values)
    const limits = {
        'Moon': 12,
        'Mars': 17,
        'Mercury': 14,
        'Jupiter': 11,
        'Venus': 10,
        'Saturn': 15
    };
    const limit = limits[planetId] || 10;
    return diff <= limit;
}
/**
 * Calculate positions for all 9 Vedic planets (Navagraha)
 * @param date - Date and time for calculation (local time)
 * @param options - Calculation options including ayanamsa, house system, and location
 * @returns Array of planet positions with Vedic astrology details
 * @throws Error if Swiss Ephemeris initialization or calculation fails
 * @example
 * ```typescript
 * // Basic calculation with default Lahiri ayanamsa
 * const planets = calculatePlanets(new Date());
 *
 * // With custom ayanamsa and location for house calculations
 * const planets = calculatePlanets(new Date(), {
 *   ayanamsa: AYANAMSA.KRISHNAMURTI,
 *   location: { latitude: 28.6139, longitude: 77.2090, timezone: 5.5 }
 * });
 *
 * // Get specific planet data
 * const sun = planets.find(p => p.name === 'Sun');
 * console.log(`${sun?.name}: ${sun?.longitude}° in ${RASHIS[sun!.rasi-1].name}`);
 * ```
 */
function calculatePlanets(date, options = {}) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const { ayanamsa = 1, includeSpeed = true, location } = options;
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
    let sunLongitude = null;
    // First pass: Calculate positions
    const calculatedPlanets = [];
    // Determine which planets to calculate
    const planetsToCalc = [...constants_1.VEDIC_PLANET_ORDER];
    if (options.includeOuterPlanets) {
        planetsToCalc.push(...constants_1.OUTER_PLANETS);
    }
    for (const planetDef of planetsToCalc) {
        if (planetDef.name === 'Ketu')
            continue;
        const result = sweph.swe_calc_ut(jd, planetDef.id, flags);
        if (result && typeof result === 'object') {
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
            else if ('longitude' in result) {
                longitude = result.longitude;
                latitude = result.latitude || 0;
                distance = result.distance || 0;
                speed = result.longitudeSpeed || result.speed || 0;
            }
            const normalizedLong = (0, utils_1.normalizeLongitude)(longitude);
            if (planetDef.name === 'Sun') {
                sunLongitude = normalizedLong;
            }
            if (planetDef.name === 'Rahu') {
                rahuLongitude = normalizedLong;
                rahuSpeed = speed;
            }
            calculatedPlanets.push({
                def: planetDef,
                longitude: normalizedLong,
                latitude,
                distance,
                speed
            });
        }
    }
    // Process results including Ketu
    for (const p of calculatedPlanets) {
        let azAlt = {};
        if (location) {
            azAlt = calculateAzAlt(jd, location, {
                longitude: p.longitude,
                latitude: p.latitude,
                distance: p.distance
            });
        }
        const isCombust = sunLongitude !== null
            ? checkCombustion(p.def.name, p.longitude, sunLongitude)
            : false;
        planets.push({
            id: p.def.name.toLowerCase(),
            name: p.def.name,
            longitude: p.longitude,
            latitude: p.latitude,
            distance: p.distance,
            speed: p.speed,
            rasi: (0, utils_1.getRashi)(p.longitude),
            rasiDegree: (0, utils_1.getRashiDegree)(p.longitude),
            isRetrograde: (0, utils_1.isRetrograde)(p.speed),
            totalDegree: p.longitude,
            ...azAlt,
            isCombust
        });
    }
    // Add Ketu
    if (rahuLongitude !== null) {
        const ketuLongitude = (0, utils_1.normalizeLongitude)(rahuLongitude + 180);
        const ketuSpeed = rahuSpeed !== null ? -rahuSpeed : 0;
        let azAlt = {};
        if (location) {
            azAlt = calculateAzAlt(jd, location, {
                longitude: ketuLongitude,
                latitude: 0,
                distance: 0
            });
        }
        planets.push({
            id: 'ketu',
            name: 'Ketu',
            longitude: ketuLongitude,
            latitude: 0,
            distance: 0,
            speed: ketuSpeed,
            rasi: (0, utils_1.getRashi)(ketuLongitude),
            rasiDegree: (0, utils_1.getRashiDegree)(ketuLongitude),
            isRetrograde: true,
            totalDegree: ketuLongitude,
            ...azAlt,
            isCombust: false
        });
    }
    return planets;
}
/**
 * Calculate position for a single planet or celestial body
 * @param planetId - Swiss Ephemeris planet ID (0=Sun, 1=Moon, 2=Mercury, etc.)
 * @param date - Date and time for calculation (local time)
 * @param options - Calculation options including ayanamsa and location
 * @returns Planet position object or null if calculation fails
 * @throws Error if Swiss Ephemeris is not initialized
 * @example
 * ```typescript
 * // Calculate Moon position
 * const moon = calculateSinglePlanet(PlanetId.MOON, new Date(), {
 *   ayanamsa: AYANAMSA.LAHIRI,
 *   location: { latitude: 27.7172, longitude: 85.324, timezone: 5.75 }
 * });
 *
 * if (moon) {
 *   console.log(`Moon at ${moon.longitude}° (${moon.azimuth}° azimuth, ${moon.altitude}° altitude)`);
 * }
 * ```
 */
function calculateSinglePlanet(planetId, date, options = {}) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const { ayanamsa = 1, includeSpeed = true, location } = options;
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
    const planetNameResult = sweph.swe_get_planet_name(planetId);
    const planetName = (typeof planetNameResult === 'object' && planetNameResult?.name)
        ? planetNameResult.name
        : (planetNameResult || `Planet ${planetId}`);
    // Az/Alt
    let azAlt = {};
    if (location) {
        azAlt = calculateAzAlt(jd, location, {
            longitude: normalizedLong,
            latitude,
            distance
        });
    }
    // Check combustion (requires Sun position if we're not Sun)
    let isCombust = false;
    if (planetId !== 0 && planetName !== 'Rahu' && planetName !== 'Ketu') { // 0 is Sun
        // Calculate Sun position briefly for combustion check
        const sunResult = sweph.swe_calc_ut(jd, 0, flags);
        const sunLong = Array.isArray(sunResult) ? sunResult[0] : (sunResult.xx ? sunResult.xx[0] : 0);
        if (sunLong !== undefined) {
            isCombust = checkCombustion(planetName, normalizedLong, (0, utils_1.normalizeLongitude)(sunLong));
        }
    }
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
        ...azAlt,
        isCombust
    };
}
/**
 * Calculate rise, set, and transit times for a celestial body
 * @param planetId - Swiss Ephemeris planet ID (0=Sun, 1=Moon, 2=Mercury, etc.)
 * @param date - Date for calculation (local time)
 * @param location - Geographic location with latitude, longitude, and timezone
 * @returns Object containing:
 *   - rise: Time when the body rises above horizon (null if it doesn't rise)
 *   - set: Time when the body sets below horizon (null if it doesn't set)
 *   - transit: Time when the body crosses the meridian (solar noon for Sun)
 *   - transitAltitude: Altitude at transit in degrees
 *   - transitDistance: Distance from Earth at transit in AU
 * @throws Error if Swiss Ephemeris calculation fails
 * @example
 * ```typescript
 * const times = calculatePlanetRiseSetTimes(0, new Date(), {
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   timezone: -5
 * });
 * console.log(`Sunrise: ${times.rise}`);
 * console.log(`Sunset: ${times.set}`);
 * ```
 */
function calculatePlanetRiseSetTimes(planetId, date, location) {
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
    const CALC_TRANSIT = sweph.SE_CALC_MTRANSIT || 4;
    // Calculate rise
    const riseResult = (0, utils_1.callRiseTrans)(jd, planetId, CALC_RISE, location);
    // Calculate set
    const setResult = (0, utils_1.callRiseTrans)(jd, planetId, CALC_SET, location);
    // Calculate transit
    const transitResult = (0, utils_1.callRiseTrans)(jd, planetId, CALC_TRANSIT, location);
    // swe_rise_trans returns { transitTime, name } or { error }
    const rise = riseResult?.transitTime
        ? (0, utils_1.julianToDate)(riseResult.transitTime, timezone)
        : riseResult?.dret?.[0]
            ? (0, utils_1.julianToDate)(riseResult.dret[0], timezone)
            : null;
    const set = setResult?.transitTime
        ? (0, utils_1.julianToDate)(setResult.transitTime, timezone)
        : setResult?.dret?.[0]
            ? (0, utils_1.julianToDate)(setResult.dret[0], timezone)
            : null;
    const transit = transitResult?.transitTime
        ? (0, utils_1.julianToDate)(transitResult.transitTime, timezone)
        : transitResult?.dret?.[0]
            ? (0, utils_1.julianToDate)(transitResult.dret[0], timezone)
            : null;
    // Calculate altitude at transit (if transit exists)
    let transitAltitude = 0;
    let transitDistance = 0;
    if (transit) {
        // Calculate position at transit time to get altitude/distance
        // Need to convert transit time (which is local date object) back to UTC JD
        const transitUtc = new Date(transit.getTime() - timezone * 60 * 60 * 1000);
        const transitJd = (0, utils_1.dateToJulian)(transitUtc);
        // Get equatorial position for declination/distance
        const flags = constants_1.CALC_FLAGS.SIDEREAL | constants_1.CALC_FLAGS.SWIEPH | constants_1.CALC_FLAGS.SPEED | (sweph.SEFLG_EQUATORIAL || 0x0800);
        const pos = sweph.swe_calc_ut(transitJd, planetId, flags);
        if (pos) {
            let declination = 0;
            if (Array.isArray(pos)) {
                declination = pos[1] || 0;
                transitDistance = pos[2] || 0;
            }
            else if (pos.xx) {
                declination = pos.xx[1] || 0;
                transitDistance = pos.xx[2] || 0;
            }
            // Altitude at meridian = 90 - |lat - declination|
            // This is approximate but standard for meridian transit
            transitAltitude = 90 - Math.abs(location.latitude - declination);
        }
    }
    return { rise, set, transit, transitAltitude, transitDistance };
}
//# sourceMappingURL=planets.js.map