"use strict";
/**
 * House and Lagna Calculations for @AstroFusion/sweph
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateLagna = calculateLagna;
exports.calculateHouses = calculateHouses;
exports.getHousePosition = getHousePosition;
const types_1 = require("./types");
const utils_1 = require("./utils");
/**
 * Calculate Lagna (Ascendant) and house cusps for Vedic astrology
 * @param date - Birth date and time (local time)
 * @param location - Birth location coordinates
 * @param options - Calculation options (ayanamsa, house system)
 * @returns LagnaInfo object with ascendant and all 12 house cusps
 * @throws Error if Swiss Ephemeris calculation fails
 * @example
 * ```typescript
 * const lagna = calculateLagna(new Date('1990-01-15T14:30:00'), {
 *   latitude: 27.7172,
 *   longitude: 85.324,
 *   timezone: 5.75
 * }, {
 *   ayanamsa: AYANAMSA.LAHIRI,
 *   houseSystem: HOUSE_SYSTEMS.PLACIDUS
 * });
 *
 * console.log(`Ascendant: ${lagna.rasi}°${lagna.degree.toFixed(2)}' in ${RASHIS[lagna.rasi-1].name}`);
 * console.log(`House 7 (Descendant): ${lagna.houses[6].toFixed(2)}°`);
 * ```
 */
function calculateLagna(date, location, options = {}) {
    (0, utils_1.initializeSweph)();
    const sweph = (0, utils_1.getNativeModule)();
    const { ayanamsa = 1, houseSystem = types_1.HouseSystem.PLACIDUS } = options;
    const timezone = location.timezone ?? 0;
    // Convert to UTC
    const utcTime = new Date(date.getTime() - timezone * 60 * 60 * 1000);
    const jd = (0, utils_1.dateToJulian)(utcTime);
    // Set sidereal mode
    sweph.swe_set_sid_mode(ayanamsa, 0, 0);
    // Calculate houses
    const houseResult = sweph.swe_houses(jd, location.latitude, location.longitude, houseSystem);
    let ascendant = 0;
    let houses = [];
    // Extract ascendant from result
    if ('ascendant' in houseResult && typeof houseResult.ascendant === 'number') {
        ascendant = houseResult.ascendant;
    }
    else if (Array.isArray(houseResult.cusp)) {
        ascendant = houseResult.cusp[0] || 0;
    }
    // Extract house cusps
    if (Array.isArray(houseResult.house)) {
        houses = houseResult.house;
    }
    else if (Array.isArray(houseResult.cusp)) {
        houses = houseResult.cusp.slice(1, 13);
    }
    // Get ayanamsa value and convert to sidereal
    const ayanamsaValue = (0, utils_1.getAyanamsa)(date, ayanamsa);
    // Convert to sidereal longitude
    ascendant = (0, utils_1.normalizeLongitude)(ascendant - ayanamsaValue);
    houses = houses.map(cusp => (0, utils_1.normalizeLongitude)(cusp - ayanamsaValue));
    return {
        longitude: ascendant,
        rasi: (0, utils_1.getRashi)(ascendant),
        degree: (0, utils_1.getRashiDegree)(ascendant),
        houses: houses.slice(0, 12),
        ayanamsaValue,
        // Legacy compatibility fields
        lagna: ascendant,
        lagnaRasi: (0, utils_1.getRashi)(ascendant),
        lagnaDegree: (0, utils_1.getRashiDegree)(ascendant),
        julianDay: jd,
    };
}
/**
 * Calculate house cusps only (without ascendant details)
 * @param date - Birth date and time (local time)
 * @param location - Birth location coordinates
 * @param options - Calculation options (ayanamsa, house system)
 * @returns Array of 12 house cusp longitudes in degrees (0°-360°)
 * @example
 * ```typescript
 * const houses = calculateHouses(new Date(), {
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   timezone: -5
 * });
 *
 * console.log(`1st House: ${houses[0].toFixed(2)}°`);
 * console.log(`7th House: ${houses[6].toFixed(2)}°`); // Descendant
 * ```
 */
function calculateHouses(date, location, options = {}) {
    const lagnaInfo = calculateLagna(date, location, options);
    return lagnaInfo.houses;
}
/**
 * Determine which house a planet occupies based on its longitude
 * @param planetLongitude - Planet's ecliptic longitude in degrees (0-360)
 * @param houses - Array of 12 house cusp longitudes from calculateHouses()
 * @returns House number (1-12) where the planet is located
 * @example
 * ```typescript
 * const lagna = calculateLagna(birthDate, location);
 * const planets = calculatePlanets(birthDate);
 * const sunHouse = getHousePosition(planets[0].longitude, lagna.houses);
 * console.log(`Sun is in house ${sunHouse}`);
 * ```
 */
function getHousePosition(planetLongitude, houses) {
    const normPlanet = (0, utils_1.normalizeLongitude)(planetLongitude);
    for (let i = 0; i < 12; i++) {
        const houseStart = houses[i];
        const houseEnd = houses[(i + 1) % 12];
        if (houseEnd !== undefined && houseStart !== undefined) {
            // Handle wrap-around at 360°
            if (houseStart > houseEnd) {
                // House spans 0°
                if (normPlanet >= houseStart || normPlanet < houseEnd) {
                    return i + 1;
                }
            }
            else {
                if (normPlanet >= houseStart && normPlanet < houseEnd) {
                    return i + 1;
                }
            }
        }
    }
    // Default to house 1 if not found
    return 1;
}
//# sourceMappingURL=houses.js.map