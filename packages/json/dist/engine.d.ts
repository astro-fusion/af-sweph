/**
 * JsonEngine — implements ICalculationEngine using pre-generated CSV ephemeris data.
 *
 * Tier: JSON (sits between CACHE and FAST in the calculation hierarchy)
 * Zero native dependencies — works on Vercel serverless, edge, React Native.
 */
import type { ICalculationEngine, Planet, GeoLocation, LagnaInfo, SunTimes, MoonPhase, CalculationOptions, CalculationTier } from '@af/sweph-core';
import { EphemerisStore } from './loader';
export declare class JsonEngine implements ICalculationEngine {
    readonly tier: CalculationTier;
    readonly name = "JsonEngine";
    readonly supportedFeatures: Set<"ayanamsa" | "planets" | "lagna" | "sun_times" | "moon_phase">;
    private readonly store;
    constructor(store: EphemerisStore);
    isAvailable(): Promise<boolean>;
    initialize(): Promise<void>;
    dispose(): void;
    calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]>;
    calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): Promise<LagnaInfo>;
    calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes>;
    calculateMoonPhase(date: Date): Promise<MoonPhase>;
    getAyanamsa(date: Date, type?: number): number;
}
//# sourceMappingURL=engine.d.ts.map