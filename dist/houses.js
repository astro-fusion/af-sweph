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
 * Calculate Lagna (Ascendant) and house cusps
 * @param date - Date and time for calculation
 * @param location - Geographic location
 * @param options - Calculation options
 * @returns Lagna and house information
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
    };
}
/**
 * Calculate house cusps only (without lagna details)
 * @param date - Date and time for calculation
 * @param location - Geographic location
 * @param options - Calculation options
 * @returns Array of 12 house cusp longitudes
 */
function calculateHouses(date, location, options = {}) {
    const lagnaInfo = calculateLagna(date, location, options);
    return lagnaInfo.houses;
}
/**
 * Determine which house a planet is in
 * @param planetLongitude - Planet's sidereal longitude
 * @param houses - Array of 12 house cusp longitudes
 * @returns House number (1-12)
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