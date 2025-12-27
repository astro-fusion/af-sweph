/**
 * House and Lagna Calculations for @AstroFusion/sweph
 */
import { HouseSystem } from './types';
import { initializeSweph, getNativeModule, dateToJulian, getAyanamsa, normalizeLongitude, getRashi, getRashiDegree } from './utils';
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
export function calculateLagna(date, location, options = {}) {
    initializeSweph();
    const sweph = getNativeModule();
    const { ayanamsa = 1, houseSystem = HouseSystem.PLACIDUS } = options;
    const timezone = location.timezone ?? 0;
    // Convert to UTC
    const utcTime = new Date(date.getTime() - timezone * 60 * 60 * 1000);
    const jd = dateToJulian(utcTime);
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
    const ayanamsaValue = getAyanamsa(date, ayanamsa);
    // Convert to sidereal longitude
    ascendant = normalizeLongitude(ascendant - ayanamsaValue);
    houses = houses.map(cusp => normalizeLongitude(cusp - ayanamsaValue));
    return {
        longitude: ascendant,
        rasi: getRashi(ascendant),
        degree: getRashiDegree(ascendant),
        houses: houses.slice(0, 12),
        ayanamsaValue,
        // Legacy compatibility fields
        lagna: ascendant,
        lagnaRasi: getRashi(ascendant),
        lagnaDegree: getRashiDegree(ascendant),
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
export function calculateHouses(date, location, options = {}) {
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
export function getHousePosition(planetLongitude, houses) {
    const normPlanet = normalizeLongitude(planetLongitude);
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