/**
 * WasmEngine - WebAssembly Swiss Ephemeris Engine
 * 
 * Implements ICalculationEngine using the compiled WASM module.
 * Provides high accuracy (~1 arc-second) and supports House Systems.
 */

import type {
    ICalculationEngine,
    Planet,
    GeoLocation,
    SunTimes,
    MoonPhase,
    LagnaInfo,
    CalculationOptions,
    ISwephInstance
} from '@af/sweph-core';
import {
    CalculationTier,
    EngineFeatures,
    FeatureNotSupportedError
} from '@af/sweph-core';
import { createSweph } from './index';
import { WasmLoadOptions } from './loader';

export class WasmEngine implements ICalculationEngine {
    readonly tier = CalculationTier.WASM;
    readonly name = 'wasm';
    
    readonly supportedFeatures = new Set([
        EngineFeatures.PLANETS,
        EngineFeatures.SUN_TIMES,
        EngineFeatures.MOON_PHASE,
        EngineFeatures.AYANAMSA,
        EngineFeatures.LAGNA,
        EngineFeatures.HOUSES,
        EngineFeatures.MOON_TIMES,
        EngineFeatures.PLANET_RISE_SET
    ]);
    
    private instance: ISwephInstance | null = null;
    private options?: WasmLoadOptions;

    constructor(options?: WasmLoadOptions) {
        this.options = options;
    }

    async isAvailable(): Promise<boolean> {
        // WASM is generally available in Node 12+ and modern browsers
        return typeof WebAssembly !== 'undefined';
    }

    async initialize(): Promise<void> {
        if (!this.instance) {
            this.instance = await createSweph(this.options);
        }
    }

    dispose(): void {
        this.instance = null;
    }

    private getInstance(): ISwephInstance {
        if (!this.instance) {
            throw new Error('WasmEngine not initialized. Call initialize() first.');
        }
        return this.instance;
    }

    async calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]> {
        return this.getInstance().calculatePlanets(date, options);
    }

    async calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): Promise<LagnaInfo> {
        return this.getInstance().calculateLagna(date, location, options);
    }

    async calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes> {
        return this.getInstance().calculateSunTimes(date, location);
    }

    async calculateMoonPhase(date: Date): Promise<MoonPhase> {
        return this.getInstance().calculateMoonPhase(date);
    }

    getAyanamsa(date: Date, type: number = 1): number {
        return this.getInstance().getAyanamsa(date, type);
    }
}
