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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseSystem = exports.PlanetId = exports.AyanamsaType = exports.NAKSHATRAS = exports.RASHIS = exports.AYANAMSA = exports.PLANETS = void 0;
exports.createSweph = createSweph;
exports.withSwephInstance = withSwephInstance;
exports.createServerlessSweph = createServerlessSweph;
const planets_1 = require("./planets");
const houses_1 = require("./houses");
const sun_1 = require("./sun");
const moon_1 = require("./moon");
const utils_1 = require("./utils");
const constants_1 = require("./constants");
Object.defineProperty(exports, "PLANETS", { enumerable: true, get: function () { return constants_1.PLANETS; } });
Object.defineProperty(exports, "AYANAMSA", { enumerable: true, get: function () { return constants_1.AYANAMSA; } });
Object.defineProperty(exports, "RASHIS", { enumerable: true, get: function () { return constants_1.RASHIS; } });
Object.defineProperty(exports, "NAKSHATRAS", { enumerable: true, get: function () { return constants_1.NAKSHATRAS; } });
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
    // Set serverless-specific environment variables
    if (isServerlessEnv && options?.enableCaching === false) {
        process.env.SWEPH_CACHE_MODULE = 'false';
    }
    // Auto-initialize the native module
    await (0, utils_1.initializeSweph)();
    // Set ephemeris path if provided
    if (options?.ephePath) {
        (0, utils_1.setEphemerisPath)(options.ephePath);
    }
    // Create the instance
    const instance = {
        // Planets
        async calculatePlanets(date, opts) {
            const calcOpts = {
                ayanamsa: opts?.ayanamsa ?? 1,
                location: opts?.location ? {
                    latitude: opts.location.latitude,
                    longitude: opts.location.longitude,
                } : undefined,
            };
            // Handle timezone offset
            const tzOffset = opts?.timezone ?? opts?.location?.timezone ?? 0;
            const utcDate = new Date(date.getTime() - tzOffset * 60 * 60 * 1000);
            return (0, planets_1.calculatePlanets)(utcDate, calcOpts);
        },
        async calculatePlanet(planetId, date, opts) {
            const calcOpts = {
                ayanamsa: opts?.ayanamsa ?? 1,
                location: opts?.location ? {
                    latitude: opts.location.latitude,
                    longitude: opts.location.longitude,
                } : undefined,
            };
            const tzOffset = opts?.timezone ?? opts?.location?.timezone ?? 0;
            const utcDate = new Date(date.getTime() - tzOffset * 60 * 60 * 1000);
            return (0, planets_1.calculateSinglePlanet)(planetId, utcDate, calcOpts);
        },
        async calculateRiseSet(planetId, date, location, opts) {
            const geoLoc = {
                latitude: location.latitude,
                longitude: location.longitude,
                timezone: opts?.timezone ?? location.timezone ?? 0,
            };
            const result = (0, planets_1.calculatePlanetRiseSetTimes)(planetId, date, geoLoc);
            return {
                rise: result.rise,
                set: result.set,
                transit: result.transit,
                transitAltitude: result.transitAltitude,
            };
        },
        // Lagna
        async calculateLagna(date, location, opts) {
            const geoLoc = {
                latitude: location.latitude,
                longitude: location.longitude,
                timezone: location.timezone ?? 0,
            };
            const calcOpts = {
                ayanamsa: opts?.ayanamsa ?? 1,
            };
            return (0, houses_1.calculateLagna)(date, geoLoc, calcOpts);
        },
        // Sun
        async calculateSunTimes(date, location) {
            const geoLoc = {
                latitude: location.latitude,
                longitude: location.longitude,
                timezone: location.timezone ?? 0,
            };
            return (0, sun_1.calculateSunTimes)(date, geoLoc);
        },
        async calculateSolarNoon(date, location) {
            const geoLoc = {
                latitude: location.latitude,
                longitude: location.longitude,
                timezone: location.timezone ?? 0,
            };
            return (0, sun_1.calculateSolarNoon)(date, geoLoc);
        },
        async calculateSunPath(date, location, intervalMinutes = 30) {
            const geoLoc = {
                latitude: location.latitude,
                longitude: location.longitude,
                timezone: location.timezone ?? 0,
            };
            return (0, sun_1.calculateSunPath)(date, geoLoc, intervalMinutes);
        },
        // Moon
        async calculateMoonData(date, location) {
            const geoLoc = {
                latitude: location.latitude,
                longitude: location.longitude,
                timezone: location.timezone ?? 0,
            };
            return (0, moon_1.calculateMoonData)(date, geoLoc);
        },
        async calculateMoonPhase(date) {
            return (0, moon_1.calculateMoonPhase)(date);
        },
        async calculateNextMoonPhases(date) {
            return (0, moon_1.calculateNextMoonPhases)(date);
        },
        // Utilities
        getAyanamsa(date, ayanamsaType = 1) {
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
            (0, utils_1.clearAllCaches)();
        },
        setCaching(enabled) {
            (0, utils_1.setCachingEnabled)(enabled);
        },
        // Constants
        PLANETS: constants_1.PLANETS,
        AYANAMSA: constants_1.AYANAMSA,
        RASHIS: constants_1.RASHIS,
        NAKSHATRAS: constants_1.NAKSHATRAS,
    };
    // Optional pre-warming
    if (options?.preWarm) {
        try {
            await instance.calculatePlanets(new Date(), { ayanamsa: 1 });
        }
        catch {
            // Pre-warm failure is not critical
        }
    }
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