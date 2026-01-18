/**
 * AstroCalculator - Smart Router for Multi-Tier Calculations
 *
 * This is the main entry point for the tiered SWEPH architecture.
 * It automatically selects the best available engine based on:
 * 1. Feature requirements (e.g., Lagna needs WASM/Native)
 * 2. User preferences (forceTier option)
 * 3. Engine availability
 *
 * Default Strategy: Lite-First
 * - Uses pure JS (astronomy-engine) by default
 * - Automatically escalates for unsupported features
 * - Falls back to lower tiers if higher ones fail
 */
import type { ICalculationEngine, Planet, GeoLocation, SunTimes, MoonPhase, LagnaInfo, TieredCalculationOptions, TieredResult } from '@af/sweph-core';
import { CalculationTier } from '@af/sweph-core';
/**
 * Options for AstroCalculator initialization
 */
export interface AstroCalculatorOptions {
    /** Enable caching (default: true) */
    enableCaching?: boolean;
    /** Cache TTL in milliseconds (default: 60000 = 1 minute) */
    cacheTtl?: number;
    /** Default minimum tier (default: FAST) */
    defaultMinTier?: CalculationTier;
    /** Default maximum tier (default: NATIVE) */
    defaultMaxTier?: CalculationTier;
}
/**
 * AstroCalculator - The Smart Router
 */
export declare class AstroCalculator {
    private engines;
    private cache;
    private options;
    constructor(options?: AstroCalculatorOptions);
    /**
     * Register an engine for a specific tier
     */
    registerEngine(engine: ICalculationEngine): void;
    /**
     * Get the best available engine for a calculation
     */
    private getBestEngine;
    /**
     * Check cache for a result
     */
    private checkCache;
    /**
     * Store result in cache
     */
    private storeCache;
    /**
     * Execute a calculation with automatic tier selection and fallback
     */
    private executeWithFallback;
    /**
     * Calculate planetary positions with automatic tier selection
     */
    calculatePlanets(date: Date, options?: TieredCalculationOptions): Promise<TieredResult<Planet[]>>;
    /**
     * Calculate Lagna (Ascendant) - will auto-escalate from Lite
     */
    calculateLagna(date: Date, location: GeoLocation, options?: TieredCalculationOptions): Promise<TieredResult<LagnaInfo>>;
    /**
     * Calculate sun times
     */
    calculateSunTimes(date: Date, location: GeoLocation, options?: TieredCalculationOptions): Promise<TieredResult<SunTimes>>;
    /**
     * Calculate moon phase
     */
    calculateMoonPhase(date: Date, options?: TieredCalculationOptions): Promise<TieredResult<MoonPhase>>;
    /**
     * Clear the calculation cache
     */
    clearCache(): void;
    /**
     * Get registered engines info
     */
    getEngineInfo(): Array<{
        tier: CalculationTier;
        name: string;
        features: string[];
    }>;
}
//# sourceMappingURL=calculator.d.ts.map