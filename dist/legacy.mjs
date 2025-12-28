/**
 * Legacy Compatibility Layer for @af/sweph
 *
 * This file provides backwards-compatible exports for code migrating
 * from the old @astrofusion/sweph-* packages.
 */
import { calculatePlanets, calculateSinglePlanet, calculatePlanetRiseSetTimes, calculateLagna, calculateSunTimes, calculateSunPath, calculateMoonData, calculateMoonPhase, calculateNextMoonPhases, } from './index.js';
import { initializeSweph as initSweph } from './utils.js';
// ===== Legacy Factory Functions =====
/**
 * Creates a PlanetaryCalculationProvider instance
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export function createPlanetaryCalculator(_options) {
    return createSwephCalculator();
}
/**
 * Creates a SwephCalculator instance (legacy compatibility)
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export function createSwephCalculator() {
    return {
        async calculateAllPlanetPositions(date, timeZoneOffset, ayanamsa = 1) {
            // Adjust date for timezone
            const utcDate = new Date(date.getTime() - timeZoneOffset * 60 * 60 * 1000);
            return calculatePlanets(utcDate, { ayanamsa });
        },
        async calculateLagna(date, timeZoneOffset, latitude, longitude, ayanamsa = 1) {
            return calculateLagna(date, { latitude, longitude, timezone: timeZoneOffset }, { ayanamsa });
        },
        async calculateSunTimes(date, latitude, longitude, timeZoneOffset) {
            return calculateSunTimes(date, { latitude, longitude, timezone: timeZoneOffset });
        },
        async calculateMoonTimes(date, latitude, longitude, timeZoneOffset) {
            return calculateMoonData(date, { latitude, longitude, timezone: timeZoneOffset });
        },
        async calculatePlanetRiseSetTimes(planetId, date, latitude, longitude, timeZoneOffset) {
            return calculatePlanetRiseSetTimes(planetId, date, { latitude, longitude, timezone: timeZoneOffset });
        },
        async calculateMoonPosition(date, latitude, longitude, timeZoneOffset) {
            // Calculate Moon (id 1) using implementation that supports Az/Alt
            const utcDate = new Date(date.getTime() - timeZoneOffset * 60 * 60 * 1000);
            const result = await calculateSinglePlanet(1, utcDate, {
                ayanamsa: 1, // Default ayanamsa
                location: { latitude, longitude, timezone: timeZoneOffset }
            });
            if (!result)
                throw new Error('Failed to calculate Moon position');
            return result;
        },
        async calculateMoonTransit(date, latitude, longitude, timeZoneOffset) {
            const result = calculatePlanetRiseSetTimes(1, // Moon
            date, { latitude, longitude, timezone: timeZoneOffset });
            return {
                transit: result.transit,
                altitude: result.transitAltitude,
                distance: result.transitDistance
            };
        },
        async calculateMoonPhase(date) {
            return calculateMoonPhase(date);
        },
        async calculateNextMoonPhases(date) {
            return calculateNextMoonPhases(date);
        },
        async calculateDailySunPath(date, latitude, longitude, timeZoneOffset) {
            return calculateSunPath(date, { latitude, longitude, timezone: timeZoneOffset });
        }
    };
}
/**
 * Creates a SwephAdapter instance (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
export function createSwephAdapter() {
    return createSwephCalculator();
}
/**
 * Creates a Node adapter (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
export function createNodeAdapter() {
    return createSwephCalculator();
}
/**
 * Initialize Swiss Ephemeris (legacy compatibility)
 * @deprecated The library auto-initializes; this is now a no-op
 */
export function initializeSweph() {
    initSweph();
}
/**
 * Register an adapter (legacy compatibility - no-op)
 * @deprecated Adapters are no longer needed; use direct functions
 */
export function registerAdapter(_platform, _adapter) {
    // No-op - adapters are no longer used in the new architecture
}
/**
 * Calculate kundali page data (legacy compatibility)
 * @deprecated Use individual calculation functions instead
 */
export async function calculateKundaliPageData(birthDate, location, options = {}) {
    const [planets, lagna, sunTimes, moonData] = await Promise.all([
        Promise.resolve(calculatePlanets(birthDate, options)),
        Promise.resolve(calculateLagna(birthDate, location, options)),
        Promise.resolve(calculateSunTimes(birthDate, location)),
        Promise.resolve(calculateMoonData(birthDate, location)),
    ]);
    return { planets, lagna, sunTimes, moonData };
}
//# sourceMappingURL=legacy.js.map