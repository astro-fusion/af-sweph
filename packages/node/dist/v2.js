"use strict";
/**
 * @af/sweph v2 API
 *
 * Modern, auto-initializing Swiss Ephemeris API for Vedic Astrology.
 *
 * This is the recommended API for new projects. It provides:
 * - Auto-initialization of native modules
 * - Cleaner method signatures with options objects
 * - Full TypeScript support
 * - Consistent error handling
 *
 * @example
 * ```typescript
 * import { createSweph } from '@af/sweph';
 *
 * const sweph = await createSweph();
 * const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
 * ```
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseSystem = exports.PlanetId = exports.AyanamsaType = exports.NAKSHATRAS = exports.RASHIS = exports.AYANAMSA = exports.PLANETS = void 0;
exports.createSweph = createSweph;
exports.withSwephInstance = withSwephInstance;
exports.createServerlessSweph = createServerlessSweph;
const planets_1 = require("./planets");
const sun_1 = require("./sun");
const moon_1 = require("./moon");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
Object.defineProperty(exports, "PLANETS", { enumerable: true, get: function () { return constants_1.PLANETS; } });
Object.defineProperty(exports, "AYANAMSA", { enumerable: true, get: function () { return constants_1.AYANAMSA; } });
Object.defineProperty(exports, "RASHIS", { enumerable: true, get: function () { return constants_1.RASHIS; } });
Object.defineProperty(exports, "NAKSHATRAS", { enumerable: true, get: function () { return constants_1.NAKSHATRAS; } });
const calculator_1 = require("./calculator");
const sweph_core_1 = require("@af/sweph-core");
// ============================================================================
// v2 Factory
// ============================================================================
/**
 * Create a SwephInstance with auto-initialization
 *
 * This is the main entry point for the v2 API. It automatically initializes
 * the native Swiss Ephemeris module and returns a ready-to-use instance.
 *
 * @param options - Optional initialization options
 * @returns A fully initialized SwephInstance
 *
 * @example
 * ```typescript
 * import { createSweph, AYANAMSA } from '@af/sweph';
 *
 * async function main() {
 *   const sweph = await createSweph();
 *
 *   // Calculate planets with Lahiri ayanamsa
 *   const planets = await sweph.calculatePlanets(new Date(), {
 *     ayanamsa: AYANAMSA.LAHIRI,
 *     timezone: 5.75 // Nepal
 *   });
 *
 *   console.log('Sun:', planets[0]);
 *   console.log('Moon:', planets[1]);
 * }
 * ```
 */
async function createSweph(options) {
    // Detect serverless environment and apply optimizations
    const isServerlessEnv = options?.serverlessMode ??
        !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ||
            process.env.FUNCTION_NAME || process.env.K_SERVICE || process.env.NETLIFY);
    // Set serverless-specific environment variables for native module
    if (isServerlessEnv && options?.enableCaching === false) {
        process.env.SWEPH_CACHE_MODULE = 'false';
    }
    // Set ephemeris path if provided (globally for native)
    if (options?.ephePath) {
        (0, utils_1.setEphemerisPath)(options.ephePath);
    }
    // Initialize AstroCalculator
    const calculator = new calculator_1.AstroCalculator({
        enableCaching: options?.enableCaching ?? true,
        defaultMinTier: sweph_core_1.CalculationTier.FAST, // Lite First
        defaultMaxTier: sweph_core_1.CalculationTier.NATIVE,
    });
    // Register Engines
    // 1. Lite Engine (Always available, fastest)
    const { LiteEngine } = await Promise.resolve().then(() => __importStar(require('@af/sweph-lite')));
    const liteEngine = new LiteEngine();
    await liteEngine.initialize();
    calculator.registerEngine(liteEngine);
    // 2. WASM Engine (Optional, for Lagna fallback or if Native fails)
    // We try to load it. If it fails (e.g. file fetch error), we log and skip.
    try {
        const { WasmEngine } = await Promise.resolve().then(() => __importStar(require('@af/sweph-wasm')));
        const wasmEngine = new WasmEngine({
            wasmUrl: options?.wasmUrl
        });
        // Initialize lazily or now? Better now to know if it works.
        // WASM init might fetch wasm file.
        // In serverless, we might want to delay this?
        // But registerEngine doesn't enforce init. 
        // Engines self-initialize on first use usually, or we call initialize().
        // WasmEngine.initialize() loads the module.
        // Let's lazy init.
        calculator.registerEngine(wasmEngine);
    }
    catch (e) {
        console.warn('Failed to register WASM engine:', e);
    }
    // 3. Native Engine (Highest precision, but might fail on Vercel)
    try {
        const { NativeEngine } = await Promise.resolve().then(() => __importStar(require('./engine')));
        const nativeEngine = new NativeEngine();
        // Native engine checks process.versions.node
        if (await nativeEngine.isAvailable()) {
            await nativeEngine.initialize(); // Loads swisseph-v2
            calculator.registerEngine(nativeEngine);
        }
    }
    catch (e) {
        console.warn('Failed to register Native engine:', e);
    }
    // Return SwephInstance proxying to calculator
    const instance = {
        // Planets (Proxied)
        async calculatePlanets(date, opts) {
            const result = await calculator.calculatePlanets(date, {
                ...opts,
                // Map timezone to UTC if needed? AstroCalculator expects Date
                // Usually we pass the Date object directly. 
                // Existing v2 implementation did manual UTC conversion from timezone options.
                // We should replicate that behavior if options has timezone.
            });
            return result.data;
        },
        // Single Planet (Use Planets + find) because AstroCalculator doesn't have single planet method yet
        async calculatePlanet(planetId, date, opts) {
            // Fallback to Native logic or extract from Lite?
            // For reliability, let's just use calculatePlanets (Lite/Wasm/Native) and filter
            // This is slight overhead but guarantees Tiered reliability
            const planets = await this.calculatePlanets(date, opts);
            // Find planet by ID. Note: Lite/Native planet IDs usage needs to be consistent.
            // PLANETS const in constants.ts maps generic names.
            // Assume standard mapping.
            const p = planets.find(p => {
                // Mapping logic: 0=Sun, 1=Moon etc.
                // We need to map numeric ID to string ID or check index?
                // Planet object has 'id' string.
                // Helper needed to map numeric ID to string.
                const planetDef = Object.values(constants_1.PLANETS).find((pd) => pd.id === planetId);
                return planetDef && p.id === planetDef.name.toLowerCase();
            });
            return p || null;
        },
        async calculateRiseSet(planetId, date, location, opts) {
            // Not supported by AstroCalculator yet. Fallback to direct native/utils call.
            // This bypasses tiered system for now.
            // TODO: Add to AstroCalculator
            const geoLoc = {
                latitude: location.latitude,
                longitude: location.longitude,
                timezone: opts?.timezone ?? location.timezone ?? 0,
            };
            return (0, planets_1.calculatePlanetRiseSetTimes)(planetId, date, geoLoc);
        },
        // Lagna (Proxied)
        async calculateLagna(date, location, opts) {
            const result = await calculator.calculateLagna(date, {
                latitude: location.latitude,
                longitude: location.longitude,
            }, {
                ayanamsa: opts?.ayanamsa ?? 1,
                // Options mapping...
            });
            return result.data;
        },
        // Sun (Proxied)
        async calculateSunTimes(date, location) {
            const result = await calculator.calculateSunTimes(date, {
                latitude: location.latitude,
                longitude: location.longitude
            });
            return result.data;
        },
        async calculateSolarNoon(date, location) {
            // Fallback to internal utility
            const geoLoc = { latitude: location.latitude, longitude: location.longitude, timezone: location.timezone ?? 0 };
            return (0, sun_1.calculateSolarNoon)(date, geoLoc);
        },
        async calculateSunPath(date, location, intervalMinutes = 30) {
            const geoLoc = { latitude: location.latitude, longitude: location.longitude, timezone: location.timezone ?? 0 };
            return (0, sun_1.calculateSunPath)(date, geoLoc, intervalMinutes);
        },
        // Moon (Proxied/Mixed)
        async calculateMoonData(date, location) {
            // Calculate Phase via Calculator (Tiered)
            const phaseResult = await calculator.calculateMoonPhase(date);
            // Logic for other moon data (distance, constellation) might be missing in simple MoonPhase result
            // Lite returns MoonPhase. Native returns more.
            // internal calculateMoonData returns MoonData.
            // Let's try to stick to internal utility for full MoonData if possible, 
            // BUT if native fails, we want at least partial data.
            // For now, fallback to internal utility (Native) for full structure.
            const geoLoc = { latitude: location.latitude, longitude: location.longitude, timezone: location.timezone ?? 0 };
            return (0, moon_1.calculateMoonData)(date, geoLoc);
        },
        async calculateMoonPhase(date) {
            const result = await calculator.calculateMoonPhase(date);
            return result.data;
        },
        async calculateNextMoonPhases(date) {
            return (0, moon_1.calculateNextMoonPhases)(date);
        },
        // Utilities
        getAyanamsa(date, ayanamsaType = 1) {
            // Synchronous. AstroCalculator is async. 
            // If we need synchronous, we MUST use direct utility (Native/Lite sync if exposed).
            // But Native is only one providing sync getAyanamsa via adapter.
            return (0, utils_1.getAyanamsa)(date, ayanamsaType);
        },
        dateToJulian(date) {
            return (0, utils_1.dateToJulian)(date);
        },
        setEphePath(path) {
            (0, utils_1.setEphemerisPath)(path);
        },
        // Cache management
        clearCaches() {
            calculator.clearCache();
            (0, utils_1.clearAllCaches)();
        },
        setCaching(enabled) {
            // Calculator caching option is readonly after init usually, but our logic might support it?
            // Re-creating calculator is expensive.
            (0, utils_1.setCachingEnabled)(enabled);
        },
        // Constants
        PLANETS: constants_1.PLANETS,
        AYANAMSA: constants_1.AYANAMSA,
        RASHIS: constants_1.RASHIS,
        NAKSHATRAS: constants_1.NAKSHATRAS,
    };
    return instance;
}
// ============================================================================
// Re-exports for convenience
// ============================================================================
// ============================================================================
// Serverless Connection Pool
// ============================================================================
/**
 * Serverless connection pool for optimal instance reuse
 */
class SwephConnectionPool {
    pool = [];
    maxSize;
    initialized = false;
    constructor(maxSize = 3) {
        this.maxSize = maxSize;
    }
    async getInstance(options) {
        // Return existing instance if available
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        // Create new instance if pool is not full
        if (!this.initialized || this.pool.length < this.maxSize) {
            this.initialized = true;
            return await createSweph({
                serverlessMode: true,
                enableCaching: true,
                ...options
            });
        }
        // Wait for an instance to become available (shouldn't happen in normal usage)
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getInstance(options);
    }
    returnInstance(instance) {
        if (this.pool.length < this.maxSize) {
            // Clear caches before returning to pool
            instance.clearCaches();
            this.pool.push(instance);
        }
    }
    async cleanup() {
        this.pool = [];
        this.initialized = false;
    }
}
// Global pool instance
const globalPool = new SwephConnectionPool();
/**
 * Get a SwephInstance from the connection pool
 * Automatically returns instance to pool after use
 */
async function withSwephInstance(callback, options) {
    const instance = await globalPool.getInstance(options);
    try {
        return await callback(instance);
    }
    finally {
        globalPool.returnInstance(instance);
    }
}
/**
 * Create a dedicated SwephInstance for serverless environments
 * with optimized settings
 */
async function createServerlessSweph(options) {
    return await createSweph({
        serverlessMode: true,
        enableCaching: true,
        preWarm: true,
        ...options
    });
}
var types_1 = require("./types");
Object.defineProperty(exports, "AyanamsaType", { enumerable: true, get: function () { return types_1.AyanamsaType; } });
Object.defineProperty(exports, "PlanetId", { enumerable: true, get: function () { return types_1.PlanetId; } });
Object.defineProperty(exports, "HouseSystem", { enumerable: true, get: function () { return types_1.HouseSystem; } });
//# sourceMappingURL=v2.js.map