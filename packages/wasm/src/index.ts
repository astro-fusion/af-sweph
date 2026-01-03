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
    GeoLocation
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

    function calculateMoonData(date: Date, _location: GeoLocation): MoonData {
        const jd = dateToJulian(date);

        const sunResult = adapter.swe_calc_ut(jd, PLANETS.SUN.id, adapter.SEFLG_SWIEPH);
        const moonResult = adapter.swe_calc_ut(jd, PLANETS.MOON.id, adapter.SEFLG_SWIEPH);

        if ('error' in sunResult || 'error' in moonResult) {
            throw new Error('Failed to calculate moon data');
        }

        const phase = normalizeLongitude(moonResult.longitude - sunResult.longitude);
        const illumination = (1 - Math.cos(phase * Math.PI / 180)) / 2 * 100;
        const age = phase / 360 * 29.53;

        return {
            illumination,
            age,
            phase,
            phaseName: getMoonPhaseName(phase),
            distance: moonResult.distance * 149597870.7,
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

        calculateSunTimes(_date: Date, _location: GeoLocation): SunTimes {
            return {
                sunrise: null,
                sunset: null,
                solarNoon: new Date(),
                dayLength: 12,
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

        calculatePlanetRiseSetTimes(_planetId: number, _date: Date, _location: GeoLocation): PlanetRiseSetTimes {
            return {
                rise: null,
                set: null,
                transit: null,
                transitAltitude: 0,
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
