/**
 * WasmEngine - WebAssembly Swiss Ephemeris Engine
 *
 * Implements ICalculationEngine using the compiled WASM module.
 * Provides high accuracy (~1 arc-second) and supports House Systems.
 */
import type { ICalculationEngine, Planet, GeoLocation, SunTimes, MoonPhase, LagnaInfo, CalculationOptions } from '@af/sweph-core';
import { CalculationTier } from '@af/sweph-core';
import { WasmLoadOptions } from './loader';
export declare class WasmEngine implements ICalculationEngine {
    readonly tier = CalculationTier.WASM;
    readonly name = "wasm";
    readonly supportedFeatures: Set<"ayanamsa" | "planets" | "sun_times" | "moon_phase" | "lagna" | "houses" | "moon_times" | "planet_rise_set">;
    private instance;
    private options?;
    constructor(options?: WasmLoadOptions);
    isAvailable(): Promise<boolean>;
    initialize(): Promise<void>;
    dispose(): void;
    private getInstance;
    calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]>;
    calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): Promise<LagnaInfo>;
    calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes>;
    calculateMoonPhase(date: Date): Promise<MoonPhase>;
    getAyanamsa(date: Date, type?: number): number;
}
//# sourceMappingURL=engine.d.ts.map