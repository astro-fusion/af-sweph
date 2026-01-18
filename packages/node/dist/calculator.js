"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstroCalculator = void 0;
const sweph_core_1 = require("@af/sweph-core");
/**
 * Generate a cache key from calculation parameters
 */
function generateCacheKey(method, date, options) {
    const dateKey = date.toISOString().slice(0, 16); // Minute precision
    const optionsKey = options ? JSON.stringify(options) : '';
    return `${method}:${dateKey}:${optionsKey}`;
}
/**
 * Get tier name from tier enum
 */
function getTierName(tier) {
    switch (tier) {
        case sweph_core_1.CalculationTier.CACHE: return 'cache';
        case sweph_core_1.CalculationTier.FAST: return 'lite';
        case sweph_core_1.CalculationTier.WASM: return 'wasm';
        case sweph_core_1.CalculationTier.NATIVE: return 'native';
        default: return 'lite';
    }
}
/**
 * Get accuracy level from tier
 */
function getAccuracy(tier) {
    switch (tier) {
        case sweph_core_1.CalculationTier.CACHE: return 'approximate';
        case sweph_core_1.CalculationTier.FAST: return 'approximate';
        case sweph_core_1.CalculationTier.WASM: return 'high';
        case sweph_core_1.CalculationTier.NATIVE: return 'exact';
        default: return 'approximate';
    }
}
/**
 * AstroCalculator - The Smart Router
 */
class AstroCalculator {
    engines = new Map();
    cache = new Map();
    options;
    constructor(options) {
        this.options = {
            enableCaching: options?.enableCaching ?? true,
            cacheTtl: options?.cacheTtl ?? 60000,
            defaultMinTier: options?.defaultMinTier ?? sweph_core_1.CalculationTier.FAST,
            defaultMaxTier: options?.defaultMaxTier ?? sweph_core_1.CalculationTier.NATIVE,
        };
    }
    /**
     * Register an engine for a specific tier
     */
    registerEngine(engine) {
        this.engines.set(engine.tier, engine);
    }
    /**
     * Get the best available engine for a calculation
     */
    async getBestEngine(feature, options) {
        const minTier = options?.forceTier ?? options?.minTier ?? this.options.defaultMinTier;
        const maxTier = options?.maxTier ?? this.options.defaultMaxTier;
        // If force tier is specified, use only that tier
        if (options?.forceTier !== undefined) {
            const engine = this.engines.get(options.forceTier);
            if (!engine) {
                throw new Error(`Forced tier ${sweph_core_1.CalculationTier[options.forceTier]} is not available`);
            }
            return { engine };
        }
        // Find the lowest tier that supports the feature
        for (let tier = minTier; tier <= maxTier; tier++) {
            const engine = this.engines.get(tier);
            if (!engine)
                continue;
            // Check if engine is available
            const available = await engine.isAvailable();
            if (!available)
                continue;
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
    checkCache(key) {
        if (!this.options.enableCaching)
            return null;
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check TTL
        if (Date.now() - entry.timestamp > this.options.cacheTtl) {
            this.cache.delete(key);
            return null;
        }
        return {
            data: entry.data,
            meta: {
                tier: sweph_core_1.CalculationTier.CACHE,
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
    storeCache(key, data, tier) {
        if (!this.options.enableCaching)
            return;
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            tier,
        });
    }
    /**
     * Execute a calculation with automatic tier selection and fallback
     */
    async executeWithFallback(feature, calculation, cacheKey, options) {
        // Check cache first
        const cached = this.checkCache(cacheKey);
        if (cached)
            return cached;
        const startTime = Date.now();
        let escalationReason;
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
            }
            catch (error) {
                // Handle FeatureNotSupportedError - escalate
                if (error instanceof sweph_core_1.FeatureNotSupportedError) {
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
    async calculatePlanets(date, options) {
        const cacheKey = generateCacheKey('planets', date, options);
        return this.executeWithFallback(sweph_core_1.EngineFeatures.PLANETS, (engine) => engine.calculatePlanets(date, options), cacheKey, options);
    }
    /**
     * Calculate Lagna (Ascendant) - will auto-escalate from Lite
     */
    async calculateLagna(date, location, options) {
        const cacheKey = generateCacheKey('lagna', date, { ...options, location });
        return this.executeWithFallback(sweph_core_1.EngineFeatures.LAGNA, (engine) => engine.calculateLagna(date, location, options), cacheKey, options);
    }
    /**
     * Calculate sun times
     */
    async calculateSunTimes(date, location, options) {
        const cacheKey = generateCacheKey('sun-times', date, { location });
        return this.executeWithFallback(sweph_core_1.EngineFeatures.SUN_TIMES, (engine) => engine.calculateSunTimes(date, location), cacheKey, options);
    }
    /**
     * Calculate moon phase
     */
    async calculateMoonPhase(date, options) {
        const cacheKey = generateCacheKey('moon-phase', date);
        return this.executeWithFallback(sweph_core_1.EngineFeatures.MOON_PHASE, (engine) => engine.calculateMoonPhase(date), cacheKey, options);
    }
    /**
     * Clear the calculation cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get registered engines info
     */
    getEngineInfo() {
        return Array.from(this.engines.entries()).map(([tier, engine]) => ({
            tier,
            name: engine.name,
            features: Array.from(engine.supportedFeatures),
        }));
    }
}
exports.AstroCalculator = AstroCalculator;
//# sourceMappingURL=calculator.js.map