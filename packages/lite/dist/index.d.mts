import { ICalculationEngine, CalculationTier, CalculationOptions, Planet, GeoLocation, LagnaInfo, SunTimes, MoonPhase } from '@af/sweph-core';
export { CalculationOptions, CalculationTier, EngineFeatures, FeatureNotSupportedError, GeoLocation, ICalculationEngine, LagnaInfo, MoonPhase, Planet, SunTimes, TierMetadata, TieredResult } from '@af/sweph-core';

/**
 * LiteEngine - Pure JavaScript astronomical calculation engine
 *
 * Uses astronomy-engine for calculations. This is the fastest tier
 * and is used as the default for most calculations.
 */

/**
 * LiteEngine - Implements ICalculationEngine using astronomy-engine
 */
declare class LiteEngine implements ICalculationEngine {
    readonly tier = CalculationTier.FAST;
    readonly name = "lite";
    readonly supportedFeatures: Set<"planets" | "sun_times" | "moon_phase" | "ayanamsa">;
    private initialized;
    isAvailable(): Promise<boolean>;
    initialize(): Promise<void>;
    dispose(): void;
    /**
     * Calculate planetary positions using astronomy-engine
     */
    calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]>;
    /**
     * Calculate Lagna - NOT SUPPORTED by LiteEngine
     * This will throw FeatureNotSupportedError, causing the router to escalate
     */
    calculateLagna(_date: Date, _location: GeoLocation, _options?: CalculationOptions): Promise<LagnaInfo>;
    /**
     * Calculate sun times using astronomy-engine
     */
    calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes>;
    /**
     * Calculate moon phase using astronomy-engine
     */
    calculateMoonPhase(date: Date): Promise<MoonPhase>;
    /**
     * Get approximate ayanamsa value
     */
    getAyanamsa(date: Date, type?: number): number;
}

/**
 * Factory function for creating LiteEngine instances
 */

/**
 * Create a ready-to-use Lite calculation instance
 *
 * @example
 * ```typescript
 * import { createLiteSweph } from '@af/sweph-lite';
 *
 * const sweph = await createLiteSweph();
 * const planets = await sweph.calculatePlanets(new Date());
 * ```
 */
declare function createLiteSweph(): Promise<{
    calculatePlanets: (date: Date, options?: CalculationOptions) => Promise<Planet[]>;
    calculateSunTimes: (date: Date, location: GeoLocation) => Promise<SunTimes>;
    calculateMoonPhase: (date: Date) => Promise<MoonPhase>;
    getAyanamsa: (date: Date, type?: number) => number;
}>;

export { LiteEngine, createLiteSweph };
