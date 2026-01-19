"use strict";
/**
 * WasmEngine - WebAssembly Swiss Ephemeris Engine
 *
 * Implements ICalculationEngine using the compiled WASM module.
 * Provides high accuracy (~1 arc-second) and supports House Systems.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WasmEngine = void 0;
const sweph_core_1 = require("@af/sweph-core");
const index_1 = require("./index");
class WasmEngine {
    tier = sweph_core_1.CalculationTier.WASM;
    name = 'wasm';
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
    instance = null;
    options;
    constructor(options) {
        this.options = options;
    }
    async isAvailable() {
        // WASM is generally available in Node 12+ and modern browsers
        return typeof WebAssembly !== 'undefined';
    }
    async initialize() {
        if (!this.instance) {
            this.instance = await (0, index_1.createSweph)(this.options);
        }
    }
    dispose() {
        this.instance = null;
    }
    getInstance() {
        if (!this.instance) {
            throw new Error('WasmEngine not initialized. Call initialize() first.');
        }
        return this.instance;
    }
    async calculatePlanets(date, options) {
        return this.getInstance().calculatePlanets(date, options);
    }
    async calculateLagna(date, location, options) {
        return this.getInstance().calculateLagna(date, location, options);
    }
    async calculateSunTimes(date, location) {
        return this.getInstance().calculateSunTimes(date, location);
    }
    async calculateMoonPhase(date) {
        return this.getInstance().calculateMoonPhase(date);
    }
    getAyanamsa(date, type = 1) {
        return this.getInstance().getAyanamsa(date, type);
    }
}
exports.WasmEngine = WasmEngine;
//# sourceMappingURL=engine.js.map