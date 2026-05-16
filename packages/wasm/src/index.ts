/**
 * @af/sweph-wasm
 * 
 * Swiss Ephemeris WebAssembly module for browser-based Vedic astrology calculations.
 * 
 * @example
 * ```typescript
 * import { createSweph } from '@af/sweph-wasm';
 * 
 * const sweph = await createSweph();
 * const planets = sweph.calculatePlanets(new Date());
 * ```
 */

// Re-export core types and utilities
export * from '@af/sweph-core';

// Export WASM-specific modules
export { WasmAdapter } from './adapter';
export { WasmEngine } from './engine';
export { loadWasmModule, getAdapter, isLoaded, isWasmSupported } from './loader';
export type { WasmLoadOptions } from './loader';

// Import for factory function
import { loadWasmModule, getAdapter, WasmLoadOptions } from './loader';
import type {
    ISwephInstance,
    Planet,
    CalculationOptions,
    SunTimes,
    MoonData,
    MoonPhase,
    PlanetRiseSetTimes,
    GeoLocation,
    LagnaInfo,
    HouseResult
} from '@af/sweph-core';
import {
    PLANETS,
    VEDIC_PLANET_ORDER,
    OUTER_PLANETS,
    JULIAN_UNIX_EPOCH,
    normalizeLongitude,
    getRashi,
    getRashiDegree,
    isRetrograde,
    getNakshatra
} from '@af/sweph-core';

/**
 * Create and initialize a Swiss Ephemeris instance for browser
 */
export async function createSweph(options?: WasmLoadOptions): Promise<ISwephInstance> {
    const adapter = await loadWasmModule(options);

    // Helper functions
    function dateToJulian(date: Date): number {
        return adapter.swe_julday(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate(),
            date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600,
            1
        );
    }

    function julianToDate(jd: number, timezoneOffset: number = 0): Date {
        const utcMs = (jd - JULIAN_UNIX_EPOCH) * 86400000;
        return new Date(utcMs + timezoneOffset * 60 * 60 * 1000);
    }

    function getMoonPhaseName(phase: number): string {
        const normalized = normalizeLongitude(phase);
        const phaseIndex = Math.floor((normalized + 22.5) / 45) % 8;
        const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
        return phases[phaseIndex] ?? 'New Moon';
    }

    function calculateMoonData(date: Date, location: GeoLocation): MoonData {
        const jd = dateToJulian(date);
        const timezone = location.timezone ?? 0;
        const geopos = [location.longitude, location.latitude, location.altitude || 0];

        const sunResult = adapter.swe_calc_ut(jd, PLANETS.SUN.id, adapter.SEFLG_SWIEPH);
        const moonResult = adapter.swe_calc_ut(jd, PLANETS.MOON.id, adapter.SEFLG_SWIEPH);

        if ('error' in sunResult || 'error' in moonResult) {
            throw new Error('Failed to calculate moon data');
        }

        const phase = normalizeLongitude(moonResult.longitude - sunResult.longitude);
        const illumination = (1 - Math.cos(phase * Math.PI / 180)) / 2 * 100;
        const age = phase / 360 * 29.53;

        // Calculate moon rise/set
        const riseResult = adapter.swe_rise_trans(jd, PLANETS.MOON.id, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_RISE, geopos, 0, 0);
        const setResult = adapter.swe_rise_trans(jd, PLANETS.MOON.id, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_SET, geopos, 0, 0);
        const transitResult = adapter.swe_rise_trans(jd, PLANETS.MOON.id, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_MTRANSIT, geopos, 0, 0);

        return {
            illumination,
            age,
            phase,
            phaseName: getMoonPhaseName(phase),
            distance: moonResult.distance * 149597870.7,
            moonrise: 'transitTime' in riseResult ? julianToDate(riseResult.transitTime, timezone) : null,
            moonset: 'transitTime' in setResult ? julianToDate(setResult.transitTime, timezone) : null,
            transit: 'transitTime' in transitResult ? julianToDate(transitResult.transitTime, timezone) : null,
        };
    }

    return {
        adapter,
        platform: 'browser',

        calculatePlanets(date: Date, calcOptions?: CalculationOptions): Planet[] {
            const jd = dateToJulian(date);

            const planets: Planet[] = [];
            const planetList = calcOptions?.includeOuterPlanets
                ? [...VEDIC_PLANET_ORDER, ...OUTER_PLANETS]
                : VEDIC_PLANET_ORDER;

            if (calcOptions?.ayanamsa !== undefined) {
                adapter.swe_set_sid_mode(calcOptions.ayanamsa, 0, 0);
            }

            for (const planetDef of planetList) {
                if (planetDef.id === -1) {
                    const rahu = planets.find(p => p.name === 'Rahu');
                    if (rahu) {
                        const ketuLong = normalizeLongitude(rahu.longitude + 180);
                        planets.push({
                            id: 'ketu',
                            name: 'Ketu',
                            longitude: ketuLong,
                            latitude: -rahu.latitude,
                            distance: rahu.distance,
                            speed: rahu.speed,
                            rasi: getRashi(ketuLong),
                            rasiDegree: getRashiDegree(ketuLong),
                            isRetrograde: isRetrograde(rahu.speed),
                            totalDegree: ketuLong,
                        });
                    }
                    continue;
                }

                const result = adapter.swe_calc_ut(jd, planetDef.id, adapter.SEFLG_SWIEPH | adapter.SEFLG_SPEED);

                if ('error' in result) {
                    console.warn(`Failed to calculate ${planetDef.name}: ${result.error}`);
                    continue;
                }

                planets.push({
                    id: planetDef.name.toLowerCase(),
                    name: planetDef.name,
                    longitude: result.longitude,
                    latitude: result.latitude,
                    distance: result.distance,
                    speed: result.longitudeSpeed,
                    rasi: getRashi(result.longitude),
                    rasiDegree: getRashiDegree(result.longitude),
                    isRetrograde: isRetrograde(result.longitudeSpeed),
                    totalDegree: result.longitude,
                });
            }

            return planets;
        },

        calculateSunTimes(date: Date, location: GeoLocation): SunTimes {
            const timezone = location.timezone ?? 0;
            
            // Convert to UTC midnight for the calculation base
            const utcDate = new Date(date.getTime() - timezone * 60 * 60 * 1000);
            utcDate.setUTCHours(0, 0, 0, 0);
            const jd = dateToJulian(utcDate);
            
            const geopos = [location.longitude, location.latitude, location.altitude || 0];
            
            // Standard sunrise/sunset (rsmi = SE_CALC_RISE/SET)
            const sunriseResult = adapter.swe_rise_trans(jd, 0, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_RISE, geopos, 0, 0);
            const sunsetResult = adapter.swe_rise_trans(jd, 0, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_SET, geopos, 0, 0);
            
            if ('error' in sunriseResult || 'error' in sunsetResult) {
                // If calculation fails, return safe defaults or nulls
                return {
                    sunrise: null,
                    sunset: null,
                    solarNoon: date,
                    dayLength: 0,
                };
            }

            const sunrise = julianToDate(sunriseResult.transitTime, timezone);
            const sunset = julianToDate(sunsetResult.transitTime, timezone);
            
            const dayLengthMs = sunset.getTime() - sunrise.getTime();
            const dayLength = dayLengthMs / (1000 * 60 * 60);
            const solarNoon = new Date(sunrise.getTime() + dayLengthMs / 2);

            // Twilight calculations (Sun 6 degrees below horizon for civil)
            // SE_BIT_CIVIL_TWILIGHT (0x100) or similar flags are sometimes required 
            // but in SwissEph usually you adjust the altitude or use specific rsmi bits.
            // Following node implementation pattern:
            const civilFlags = adapter.SE_CALC_RISE | 0x100; // SE_BIT_CIVIL_TWILIGHT usually 0x100
            const civilSetFlags = adapter.SE_CALC_SET | 0x100;
            
            const cRiseResult = adapter.swe_rise_trans(jd, 0, '', adapter.SEFLG_SWIEPH, civilFlags, geopos, 0, 0);
            const cSetResult = adapter.swe_rise_trans(jd, 0, '', adapter.SEFLG_SWIEPH, civilSetFlags, geopos, 0, 0);

            return {
                sunrise,
                sunset,
                solarNoon,
                dayLength,
                civilTwilightStart: 'transitTime' in cRiseResult ? julianToDate(cRiseResult.transitTime, timezone) : null,
                civilTwilightEnd: 'transitTime' in cSetResult ? julianToDate(cSetResult.transitTime, timezone) : null,
            };
        },

        calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): LagnaInfo {
            const jd = dateToJulian(date);
            const ayanamsa = options?.ayanamsa ?? 1;
            const houseSystem = options?.houseSystem ? options.houseSystem.charCodeAt(0) : 'P'.charCodeAt(0);

            // Set sidereal mode
            adapter.swe_set_sid_mode(ayanamsa, 0, 0);

            const result = adapter.swe_houses(jd, location.latitude, location.longitude, houseSystem);

            if ('error' in result) {
                throw new Error(result.error);
            }

            const ayanamsaVal = adapter.swe_get_ayanamsa(jd);
            
            // Apply ayanamsa correction (Tropical -> Sidereal)
            const ascendant = normalizeLongitude(result.ascmc[0] - ayanamsaVal);
            const houses = result.cusp.slice(1, 13).map((c: number) => normalizeLongitude(c - ayanamsaVal));

            return {
                longitude: ascendant,
                rasi: getRashi(ascendant),
                rasiDegree: getRashiDegree(ascendant),
                houses,
            };
        },

        calculateMoonData,

        calculateMoonPhase(date: Date): MoonPhase {
            const data = calculateMoonData(date, { latitude: 0, longitude: 0 });
            return {
                phase: data.phase,
                illumination: data.illumination,
                age: data.age,
                phaseName: data.phaseName,
            };
        },

        calculatePlanetRiseSetTimes(planetId: number, date: Date, location: GeoLocation): PlanetRiseSetTimes {
            const timezone = location.timezone ?? 0;
            const jd = dateToJulian(date);
            const geopos = [location.longitude, location.latitude, location.altitude || 0];

            const riseResult = adapter.swe_rise_trans(jd, planetId, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_RISE, geopos, 0, 0);
            const setResult = adapter.swe_rise_trans(jd, planetId, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_SET, geopos, 0, 0);
            const transitResult = adapter.swe_rise_trans(jd, planetId, '', adapter.SEFLG_SWIEPH, adapter.SE_CALC_MTRANSIT, geopos, 0, 0);

            return {
                rise: 'transitTime' in riseResult ? julianToDate(riseResult.transitTime, timezone) : null,
                set: 'transitTime' in setResult ? julianToDate(setResult.transitTime, timezone) : null,
                transit: 'transitTime' in transitResult ? julianToDate(transitResult.transitTime, timezone) : null,
                transitAltitude: 0, // Not calculated in this pass
                transitDistance: 0,
            };
        },

        getAyanamsa(date: Date, ayanamsaType: number = 1): number {
            const jd = dateToJulian(date);
            adapter.swe_set_sid_mode(ayanamsaType, 0, 0);
            return adapter.swe_get_ayanamsa(jd);
        },

        dateToJulian,
        julianToDate,
    };
}

/**
 * Initialize Swiss Ephemeris (alias for createSweph for API compatibility)
 */
export async function initializeSweph(options?: WasmLoadOptions): Promise<void> {
    await loadWasmModule(options);
}

// Default export
export default { createSweph, initializeSweph };
