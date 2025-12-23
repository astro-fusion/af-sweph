"use strict";
/**
 * Legacy Compatibility Layer for @af/sweph
 *
 * This file provides backwards-compatible exports for code migrating
 * from the old @astrofusion/sweph-* packages.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanetaryCalculator = createPlanetaryCalculator;
exports.createSwephCalculator = createSwephCalculator;
exports.createSwephAdapter = createSwephAdapter;
exports.createNodeAdapter = createNodeAdapter;
exports.initializeSweph = initializeSweph;
exports.registerAdapter = registerAdapter;
exports.calculateKundaliPageData = calculateKundaliPageData;
const index_1 = require("./index");
const utils_1 = require("./utils");
// ===== Legacy Factory Functions =====
/**
 * Creates a PlanetaryCalculationProvider instance
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
function createPlanetaryCalculator() {
    return createSwephCalculator();
}
/**
 * Creates a SwephCalculator instance (legacy compatibility)
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
function createSwephCalculator() {
    return {
        async calculateAllPlanetPositions(date, timeZoneOffset, ayanamsa = 1) {
            // Adjust date for timezone
            const utcDate = new Date(date.getTime() - timeZoneOffset * 60 * 60 * 1000);
            return (0, index_1.calculatePlanets)(utcDate, { ayanamsa });
        },
        async calculateLagna(date, timeZoneOffset, latitude, longitude, ayanamsa = 1) {
            return (0, index_1.calculateLagna)(date, { latitude, longitude, timezone: timeZoneOffset }, { ayanamsa });
        },
        async calculateSunTimes(date, latitude, longitude, timeZoneOffset) {
            return (0, index_1.calculateSunTimes)(date, { latitude, longitude, timezone: timeZoneOffset });
        },
        async calculateMoonTimes(date, latitude, longitude, timeZoneOffset) {
            return (0, index_1.calculateMoonData)(date, { latitude, longitude, timezone: timeZoneOffset });
        },
        async calculatePlanetRiseSetTimes(date, planetId, latitude, longitude, timeZoneOffset) {
            return (0, index_1.calculatePlanetRiseSetTimes)(planetId, date, { latitude, longitude, timezone: timeZoneOffset });
        },
        async calculateMoonPosition(date, latitude, longitude, timeZoneOffset) {
            // Calculate Moon (id 1) using implementation that supports Az/Alt
            const utcDate = new Date(date.getTime() - timeZoneOffset * 60 * 60 * 1000);
            const result = await (0, index_1.calculateSinglePlanet)(1, utcDate, {
                ayanamsa: 1, // Default ayanamsa
                location: { latitude, longitude, timezone: timeZoneOffset }
            });
            if (!result)
                throw new Error('Failed to calculate Moon position');
            return result;
        },
        async calculateMoonPhase(date) {
            return (0, index_1.calculateMoonPhase)(date);
        },
        async calculateMoonTransit(date, latitude, longitude, timeZoneOffset) {
            return (0, index_1.calculateMoonData)(date, { latitude, longitude, timezone: timeZoneOffset });
        },
        async calculateNextMoonPhases(date) {
            return (0, index_1.calculateNextMoonPhases)(date);
        },
        async calculateDailySunPath(date, latitude, longitude, timeZoneOffset) {
            return (0, index_1.calculateSunPath)(date, { latitude, longitude, timezone: timeZoneOffset });
        }
    };
}
/**
 * Creates a SwephAdapter instance (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
function createSwephAdapter() {
    return createSwephCalculator();
}
/**
 * Creates a Node adapter (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
function createNodeAdapter() {
    return createSwephCalculator();
}
/**
 * Initialize Swiss Ephemeris (legacy compatibility)
 * @deprecated The library auto-initializes; this is now a no-op
 */
function initializeSweph() {
    (0, utils_1.initializeSweph)();
}
/**
 * Register an adapter (legacy compatibility - no-op)
 * @deprecated Adapters are no longer needed; use direct functions
 */
function registerAdapter(_platform, _adapter) {
    // No-op - adapters are no longer used in the new architecture
}
/**
 * Calculate kundali page data (legacy compatibility)
 * @deprecated Use individual calculation functions instead
 */
async function calculateKundaliPageData(birthDate, location, options = {}) {
    const [planets, lagna, sunTimes, moonData] = await Promise.all([
        Promise.resolve((0, index_1.calculatePlanets)(birthDate, options)),
        Promise.resolve((0, index_1.calculateLagna)(birthDate, location, options)),
        Promise.resolve((0, index_1.calculateSunTimes)(birthDate, location)),
        Promise.resolve((0, index_1.calculateMoonData)(birthDate, location)),
    ]);
    return { planets, lagna, sunTimes, moonData };
}
//# sourceMappingURL=legacy.js.map