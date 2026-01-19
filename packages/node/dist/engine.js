"use strict";
/**
 * NativeEngine - Node.js Native Swiss Ephemeris Engine
 *
 * Implements ICalculationEngine using the native C++ module (via swisseph-v2 or existing functions).
 * Provides highest accuracy and full feature support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeEngine = void 0;
const sweph_core_1 = require("@af/sweph-core");
const planets_1 = require("./planets");
const houses_1 = require("./houses");
const sun_1 = require("./sun");
const moon_1 = require("./moon");
const utils_1 = require("./utils");
class NativeEngine {
    tier = sweph_core_1.CalculationTier.NATIVE;
    name = 'native';
    supportedFeatures = new Set([
        sweph_core_1.EngineFeatures.PLANETS,
        sweph_core_1.EngineFeatures.SUN_TIMES,
        sweph_core_1.EngineFeatures.MOON_PHASE,
        sweph_core_1.EngineFeatures.AYANAMSA,
        sweph_core_1.EngineFeatures.LAGNA,
        sweph_core_1.EngineFeatures.HOUSES,
        sweph_core_1.EngineFeatures.MOON_TIMES,
        sweph_core_1.EngineFeatures.PLANET_RISE_SET
    ]);
    initialized = false;
    async isAvailable() {
        // Native engine is available if we are in Node.js
        return typeof process !== 'undefined' &&
            process.versions != null &&
            process.versions.node != null;
    }
    async initialize() {
        if (!this.initialized) {
            await (0, utils_1.initializeSweph)();
            this.initialized = true;
        }
    }
    dispose() {
        // Native module stays loaded
    }
    async calculatePlanets(date, options) {
        return (0, planets_1.calculatePlanets)(date, options);
    }
    async calculateLagna(date, location, options) {
        return (0, houses_1.calculateLagna)(date, location, options);
    }
    async calculateSunTimes(date, location) {
        return (0, sun_1.calculateSunTimes)(date, location);
    }
    async calculateMoonPhase(date) {
        return (0, moon_1.calculateMoonPhase)(date);
    }
    getAyanamsa(date, type = 1) {
        return (0, utils_1.getAyanamsa)(date, type);
    }
    setEphePath(path) {
        (0, utils_1.setEphemerisPath)(path);
    }
}
exports.NativeEngine = NativeEngine;
//# sourceMappingURL=engine.js.map