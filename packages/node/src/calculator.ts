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

import type {
    ICalculationEngine,
    Planet,
    GeoLocation,
    SunTimes,
    MoonPhase,
    LagnaInfo,
    CalculationOptions,
    TieredCalculationOptions,
    TieredResult,
    TierMetadata,
} from '@af/sweph-core';
import {
    CalculationTier,
    FeatureNotSupportedError,
    EngineFeatures,
} from '@af/sweph-core';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    tier: CalculationTier;
}

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
 * Generate a cache key from calculation parameters
 */
function generateCacheKey(
    method: string,
    date: Date,
    options?: CalculationOptions
): string {
    const dateKey = date.toISOString().slice(0, 16); // Minute precision
    const optionsKey = options ? JSON.stringify(options) : '';
    return `${method}:${dateKey}:${optionsKey}`;
}

/**
 * Get tier name from tier enum
 */
function getTierName(tier: CalculationTier): TierMetadata['tierName'] {
    switch (tier) {
        case CalculationTier.CACHE: return 'cache';
        case CalculationTier.FAST: return 'lite';
        case CalculationTier.WASM: return 'wasm';
        case CalculationTier.NATIVE: return 'native';
        default: return 'lite';
    }
}

/**
 * Get accuracy level from tier
 */
function getAccuracy(tier: CalculationTier): TierMetadata['accuracy'] {
    switch (tier) {
        case CalculationTier.CACHE: return 'approximate';
        case CalculationTier.FAST: return 'approximate';
        case CalculationTier.WASM: return 'high';
        case CalculationTier.NATIVE: return 'exact';
        default: return 'approximate';
    }
}

/**
 * AstroCalculator - The Smart Router
 */
export class AstroCalculator {
    private engines: Map<CalculationTier, ICalculationEngine> = new Map();
    private cache: Map<string, CacheEntry<unknown>> = new Map();
    private options: Required<AstroCalculatorOptions>;

    constructor(options?: AstroCalculatorOptions) {
        this.options = {
            enableCaching: options?.enableCaching ?? true,
            cacheTtl: options?.cacheTtl ?? 60000,
            defaultMinTier: options?.defaultMinTier ?? CalculationTier.FAST,
            defaultMaxTier: options?.defaultMaxTier ?? CalculationTier.NATIVE,
        };
    }

    /**
     * Register an engine for a specific tier
     */
    registerEngine(engine: ICalculationEngine): void {
        this.engines.set(engine.tier, engine);
    }

    /**
     * Get the best available engine for a calculation
     */
    private async getBestEngine(
        feature: string,
        options?: TieredCalculationOptions
    ): Promise<{ engine: ICalculationEngine; escalationReason?: string }> {
        const minTier = options?.forceTier ?? options?.minTier ?? this.options.defaultMinTier;
        const maxTier = options?.maxTier ?? this.options.defaultMaxTier;

        // If force tier is specified, use only that tier
        if (options?.forceTier !== undefined) {
            const engine = this.engines.get(options.forceTier);
            if (!engine) {
                throw new Error(`Forced tier ${CalculationTier[options.forceTier]} is not available`);
            }
            return { engine };
        }

        // Find the lowest tier that supports the feature
        for (let tier = minTier; tier <= maxTier; tier++) {
            const engine = this.engines.get(tier);
            if (!engine) continue;

            // Check if engine is available
            const available = await engine.isAvailable();
            if (!available) continue;

            // Check if engine supports the feature
            if (engine.supportedFeatures.has(feature)) {
                const escalationReason = tier > minTier
                    ? `Feature '${feature}' not supported by lower tiers`
                    : undefined;
                return { engine, escalationReason };
            }
        }

        throw new Error(`No engine available that supports feature '${feature}'`);
    }

    /**
     * Check cache for a result
     */
    private checkCache<T>(key: string): TieredResult<T> | null {
        if (!this.options.enableCaching) return null;

        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > this.options.cacheTtl) {
            this.cache.delete(key);
            return null;
        }

        return {
            data: entry.data,
            meta: {
                tier: CalculationTier.CACHE,
                tierName: 'cache',
                accuracy: getAccuracy(entry.tier),
                latencyMs: 0,
                cached: true,
            },
        };
    }

    /**
     * Store result in cache
     */
    private storeCache<T>(key: string, data: T, tier: CalculationTier): void {
        if (!this.options.enableCaching) return;

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            tier,
        });
    }

    /**
     * Execute a calculation with automatic tier selection and fallback
     */
    private async executeWithFallback<T>(
        feature: string,
        calculation: (engine: ICalculationEngine) => Promise<T>,
        cacheKey: string,
        options?: TieredCalculationOptions
    ): Promise<TieredResult<T>> {
        // Check cache first
        const cached = this.checkCache<T>(cacheKey);
        if (cached) return cached;

        const startTime = Date.now();
        let escalationReason: string | undefined;
        let currentTier = options?.forceTier ?? options?.minTier ?? this.options.defaultMinTier;
        const maxTier = options?.maxTier ?? this.options.defaultMaxTier;

        // Try each tier, escalating on failure
        while (currentTier <= maxTier) {
            const engine = this.engines.get(currentTier);
            
            if (!engine) {
                currentTier++;
                continue;
            }

            try {
                // Check availability
                const available = await engine.isAvailable();
                if (!available) {
                    escalationReason = `Tier ${getTierName(currentTier)} not available`;
                    currentTier++;
                    continue;
                }

                // Check feature support
                if (!engine.supportedFeatures.has(feature)) {
                    escalationReason = `Feature '${feature}' not supported by ${getTierName(currentTier)}`;
                    currentTier++;
                    continue;
                }

                // Execute calculation
                const data = await calculation(engine);
                const latencyMs = Date.now() - startTime;

                // Cache the result
                this.storeCache(cacheKey, data, currentTier);

                return {
                    data,
                    meta: {
                        tier: currentTier,
                        tierName: getTierName(currentTier),
                        accuracy: getAccuracy(currentTier),
                        latencyMs,
                        cached: false,
                        escalationReason,
                    },
                };
            } catch (error) {
                // Handle FeatureNotSupportedError - escalate
                if (error instanceof FeatureNotSupportedError) {
                    escalationReason = error.message;
                    currentTier++;
                    continue;
                }

                // Other errors - try next tier
                console.warn(`[AstroCalculator] Tier ${getTierName(currentTier)} failed:`, error);
                escalationReason = `Tier ${getTierName(currentTier)} failed: ${error instanceof Error ? error.message : String(error)}`;
                currentTier++;
            }
        }

        throw new Error(`All tiers exhausted. Last reason: ${escalationReason}`);
    }

    // =========================================================================
    // Public Calculation Methods
    // =========================================================================

    /**
     * Calculate planetary positions with automatic tier selection
     */
    async calculatePlanets(
        date: Date,
        options?: TieredCalculationOptions
    ): Promise<TieredResult<Planet[]>> {
        const cacheKey = generateCacheKey('planets', date, options);
        
        return this.executeWithFallback(
            EngineFeatures.PLANETS,
            (engine) => engine.calculatePlanets(date, options),
            cacheKey,
            options
        );
    }

    /**
     * Calculate Lagna (Ascendant) - will auto-escalate from Lite
     */
    async calculateLagna(
        date: Date,
        location: GeoLocation,
        options?: TieredCalculationOptions
    ): Promise<TieredResult<LagnaInfo>> {
        const cacheKey = generateCacheKey('lagna', date, { ...options, location });

        return this.executeWithFallback(
            EngineFeatures.LAGNA,
            (engine) => engine.calculateLagna(date, location, options),
            cacheKey,
            options
        );
    }

    /**
     * Calculate sun times
     */
    async calculateSunTimes(
        date: Date,
        location: GeoLocation,
        options?: TieredCalculationOptions
    ): Promise<TieredResult<SunTimes>> {
        const cacheKey = generateCacheKey('sun-times', date, { location });

        return this.executeWithFallback(
            EngineFeatures.SUN_TIMES,
            (engine) => engine.calculateSunTimes(date, location),
            cacheKey,
            options
        );
    }

    /**
     * Calculate moon phase
     */
    async calculateMoonPhase(
        date: Date,
        options?: TieredCalculationOptions
    ): Promise<TieredResult<MoonPhase>> {
        const cacheKey = generateCacheKey('moon-phase', date);

        return this.executeWithFallback(
            EngineFeatures.MOON_PHASE,
            (engine) => engine.calculateMoonPhase(date),
            cacheKey,
            options
        );
    }

    /**
     * Clear the calculation cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get registered engines info
     */
    getEngineInfo(): Array<{ tier: CalculationTier; name: string; features: string[] }> {
        return Array.from(this.engines.entries()).map(([tier, engine]) => ({
            tier,
            name: engine.name,
            features: Array.from(engine.supportedFeatures),
        }));
    }
}
