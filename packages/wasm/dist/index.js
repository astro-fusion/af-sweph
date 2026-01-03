"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWasmSupported = exports.isLoaded = exports.getAdapter = exports.loadWasmModule = exports.WasmAdapter = void 0;
exports.createSweph = createSweph;
exports.initializeSweph = initializeSweph;
// Re-export core types and utilities
__exportStar(require("@af/sweph-core"), exports);
// Export WASM-specific modules
var adapter_1 = require("./adapter");
Object.defineProperty(exports, "WasmAdapter", { enumerable: true, get: function () { return adapter_1.WasmAdapter; } });
var loader_1 = require("./loader");
Object.defineProperty(exports, "loadWasmModule", { enumerable: true, get: function () { return loader_1.loadWasmModule; } });
Object.defineProperty(exports, "getAdapter", { enumerable: true, get: function () { return loader_1.getAdapter; } });
Object.defineProperty(exports, "isLoaded", { enumerable: true, get: function () { return loader_1.isLoaded; } });
Object.defineProperty(exports, "isWasmSupported", { enumerable: true, get: function () { return loader_1.isWasmSupported; } });
// Import for factory function
const loader_2 = require("./loader");
const sweph_core_1 = require("@af/sweph-core");
/**
 * Create and initialize a Swiss Ephemeris instance for browser
 */
async function createSweph(options) {
    const adapter = await (0, loader_2.loadWasmModule)(options);
    // Helper functions
    function dateToJulian(date) {
        return adapter.swe_julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600, 1);
    }
    function julianToDate(jd, timezoneOffset = 0) {
        const utcMs = (jd - sweph_core_1.JULIAN_UNIX_EPOCH) * 86400000;
        return new Date(utcMs + timezoneOffset * 60 * 60 * 1000);
    }
    function getMoonPhaseName(phase) {
        const normalized = (0, sweph_core_1.normalizeLongitude)(phase);
        const phaseIndex = Math.floor((normalized + 22.5) / 45) % 8;
        const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
        return phases[phaseIndex] ?? 'New Moon';
    }
    function calculateMoonData(date, _location) {
        const jd = dateToJulian(date);
        const sunResult = adapter.swe_calc_ut(jd, sweph_core_1.PLANETS.SUN.id, adapter.SEFLG_SWIEPH);
        const moonResult = adapter.swe_calc_ut(jd, sweph_core_1.PLANETS.MOON.id, adapter.SEFLG_SWIEPH);
        if ('error' in sunResult || 'error' in moonResult) {
            throw new Error('Failed to calculate moon data');
        }
        const phase = (0, sweph_core_1.normalizeLongitude)(moonResult.longitude - sunResult.longitude);
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
        calculatePlanets(date, calcOptions) {
            const jd = dateToJulian(date);
            const planets = [];
            const planetList = calcOptions?.includeOuterPlanets
                ? [...sweph_core_1.VEDIC_PLANET_ORDER, ...sweph_core_1.OUTER_PLANETS]
                : sweph_core_1.VEDIC_PLANET_ORDER;
            if (calcOptions?.ayanamsa !== undefined) {
                adapter.swe_set_sid_mode(calcOptions.ayanamsa, 0, 0);
            }
            for (const planetDef of planetList) {
                if (planetDef.id === -1) {
                    const rahu = planets.find(p => p.name === 'Rahu');
                    if (rahu) {
                        const ketuLong = (0, sweph_core_1.normalizeLongitude)(rahu.longitude + 180);
                        planets.push({
                            id: 'ketu',
                            name: 'Ketu',
                            longitude: ketuLong,
                            latitude: -rahu.latitude,
                            distance: rahu.distance,
                            speed: rahu.speed,
                            rasi: (0, sweph_core_1.getRashi)(ketuLong),
                            rasiDegree: (0, sweph_core_1.getRashiDegree)(ketuLong),
                            isRetrograde: (0, sweph_core_1.isRetrograde)(rahu.speed),
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
                    rasi: (0, sweph_core_1.getRashi)(result.longitude),
                    rasiDegree: (0, sweph_core_1.getRashiDegree)(result.longitude),
                    isRetrograde: (0, sweph_core_1.isRetrograde)(result.longitudeSpeed),
                    totalDegree: result.longitude,
                });
            }
            return planets;
        },
        calculateSunTimes(_date, _location) {
            return {
                sunrise: null,
                sunset: null,
                solarNoon: new Date(),
                dayLength: 12,
            };
        },
        calculateMoonData,
        calculateMoonPhase(date) {
            const data = calculateMoonData(date, { latitude: 0, longitude: 0 });
            return {
                phase: data.phase,
                illumination: data.illumination,
                age: data.age,
                phaseName: data.phaseName,
            };
        },
        calculatePlanetRiseSetTimes(_planetId, _date, _location) {
            return {
                rise: null,
                set: null,
                transit: null,
                transitAltitude: 0,
                transitDistance: 0,
            };
        },
        getAyanamsa(date, ayanamsaType = 1) {
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
async function initializeSweph(options) {
    await (0, loader_2.loadWasmModule)(options);
}
// Default export
exports.default = { createSweph, initializeSweph };
//# sourceMappingURL=index.js.map