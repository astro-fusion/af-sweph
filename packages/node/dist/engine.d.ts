/**
 * NativeEngine - Node.js Native Swiss Ephemeris Engine
 *
 * Implements ICalculationEngine using the native C++ module (via swisseph-v2 or existing functions).
 * Provides highest accuracy and full feature support.
 */
import type { ICalculationEngine, Planet, GeoLocation, SunTimes, MoonPhase, LagnaInfo, CalculationOptions } from '@af/sweph-core';
import { CalculationTier } from '@af/sweph-core';
export declare class NativeEngine implements ICalculationEngine {
    readonly tier = CalculationTier.NATIVE;
    readonly name = "native";
    readonly supportedFeatures: Set<"planets" | "lagna" | "sun_times" | "moon_phase" | "ayanamsa" | "houses" | "moon_times" | "planet_rise_set">;
    private initialized;
    isAvailable(): Promise<boolean>;
    initialize(): Promise<void>;
    dispose(): void;
    calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]>;
    calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): Promise<LagnaInfo>;
    calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes>;
    calculateMoonPhase(date: Date): Promise<MoonPhase>;
    getAyanamsa(date: Date, type?: number): number;
    setEphePath(path: string): void;
}
//# sourceMappingURL=engine.d.ts.map