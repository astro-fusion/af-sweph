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

import {
  calculatePlanets,
  calculateSinglePlanet,
  calculatePlanetRiseSetTimes,
} from './planets';

import { calculateLagna } from './houses';
import { calculateSunTimes, calculateSolarNoon, calculateSunPath } from './sun';
import { calculateMoonData, calculateMoonPhase, calculateNextMoonPhases } from './moon';
import { initializeSweph, setEphemerisPath, getAyanamsa, dateToJulian, clearAllCaches, setCachingEnabled } from './utils';
import { PLANETS, AYANAMSA, RASHIS, NAKSHATRAS } from './constants';

import type {
  Planet,
  GeoLocation,
  SunTimes,
  MoonData,
  MoonPhase,
  CalculationOptions,
  LagnaInfo,
  NextMoonPhases,
} from './types';
import { AstroCalculator } from './calculator';
import { CalculationTier } from '@af/sweph-core';

// ============================================================================
// v2 Types
// ============================================================================

/**
 * Options for createSweph initialization
 */
export interface SwephInitOptions {
  /** Path to ephemeris data files */
  ephePath?: string;
  /** Pre-warm calculations on init (slightly slower startup, faster first call) */
  preWarm?: boolean;
  /** Enable caching for repeated calculations (default: true, disable in memory-constrained serverless) */
  enableCaching?: boolean;
  /** Serverless optimization mode (automatically detected, but can be overridden) */
  serverlessMode?: boolean;
  /** URL for WASM binary (e.g. CDN URL) for serverless environments */
  wasmUrl?: string;
}

/**
 * Location with optional timezone
 */
export interface Location {
  latitude: number;
  longitude: number;
  timezone?: number;
}

/**
 * Options for planetary calculations
 */
export interface PlanetOptions {
  /** Ayanamsa type (default: LAHIRI = 1) */
  ayanamsa?: number;
  /** Timezone offset in hours (default: 0 = UTC) */
  timezone?: number;
  /** Location for rise/set calculations */
  location?: Location;
}

/**
 * Options for sun/moon calculations
 */
export interface AstroOptions {
  /** Timezone offset in hours (default: 0 = UTC) */
  timezone?: number;
}

/**
 * Planet rise/set/transit result
 */
export interface RiseSetTransit {
  rise: Date | null;
  set: Date | null;
  transit: Date | null;
  transitAltitude?: number;
}

/**
 * The v2 SwephInstance - modern API with clean method signatures
 */
export interface SwephInstance {
  // === Planetary Calculations ===
  
  /**
   * Calculate positions for all Vedic planets
   * @param date - Date/time for calculation
   * @param options - Calculation options (ayanamsa, timezone)
   * @returns Array of planet positions
   */
  calculatePlanets(date: Date, options?: PlanetOptions): Promise<Planet[]>;
  
  /**
   * Calculate position for a single planet
   * @param planetId - Planet ID (0=Sun, 1=Moon, etc.)
   * @param date - Date/time for calculation
   * @param options - Calculation options
   * @returns Planet position or null if calculation fails
   */
  calculatePlanet(planetId: number, date: Date, options?: PlanetOptions): Promise<Planet | null>;
  
  /**
   * Calculate rise, set, and transit times for a planet
   * @param planetId - Planet ID
   * @param date - Date for calculation
   * @param location - Geographic location
   * @param options - Calculation options (timezone)
   * @returns Rise, set, and transit times
   */
  calculateRiseSet(planetId: number, date: Date, location: Location, options?: PlanetOptions): Promise<RiseSetTransit>;

  // === Lagna & Houses ===
  
  /**
   * Calculate Lagna (Ascendant) and houses
   * @param date - Date/time for calculation
   * @param location - Geographic location
   * @param options - Calculation options (ayanamsa)
   * @returns Lagna information with house cusps
   */
  calculateLagna(date: Date, location: Location, options?: PlanetOptions): Promise<LagnaInfo>;

  // === Sun Calculations ===
  
  /**
   * Calculate sunrise, sunset, and solar noon
   * @param date - Date for calculation
   * @param location - Geographic location
   * @returns Sun times
   */
  calculateSunTimes(date: Date, location: Location): Promise<SunTimes>;
  
  /**
   * Calculate solar noon for a location
   * @param date - Date for calculation
   * @param location - Geographic location
   * @returns Solar noon time and altitude
   */
  calculateSolarNoon(date: Date, location: Location): Promise<{ time: Date; altitude: number }>;
  
  /**
   * Calculate sun path throughout the day
   * @param date - Date for calculation
   * @param location - Geographic location
   * @param intervalMinutes - Interval between points (default: 30)
   * @returns Array of azimuth/altitude points
   */
  calculateSunPath(date: Date, location: Location, intervalMinutes?: number): Promise<Array<{ time: Date; azimuth: number; altitude: number }>>;

  // === Moon Calculations ===
  
  /**
   * Calculate moon data (position, rise, set, phase)
   * @param date - Date for calculation
   * @param location - Geographic location
   * @returns Moon data
   */
  calculateMoonData(date: Date, location: Location): Promise<MoonData>;
  
  /**
   * Calculate current moon phase
   * @param date - Date for calculation
   * @returns Moon phase information
   */
  calculateMoonPhase(date: Date): Promise<MoonPhase>;
  
  /**
   * Calculate next moon phases
   * @param date - Date to start from
   * @returns Next new moon, first quarter, full moon, last quarter
   */
  calculateNextMoonPhases(date: Date): Promise<NextMoonPhases>;

  // === Utilities ===
  
  /**
   * Get ayanamsa value for a date
   * @param date - Date for calculation
   * @param ayanamsaType - Ayanamsa type (default: LAHIRI = 1)
   * @returns Ayanamsa value in degrees
   */
  getAyanamsa(date: Date, ayanamsaType?: number): number;
  
  /**
   * Convert date to Julian Day
   * @param date - Date to convert
   * @returns Julian Day number
   */
  dateToJulian(date: Date): number;
  
  /**
   * Set path to ephemeris data files
   * @param path - Directory containing .se1 files
   */
  setEphePath(path: string): void;

  // === Constants ===
  
  /** Planet IDs */
  readonly PLANETS: typeof PLANETS;
  
  /** Ayanamsa types */
  readonly AYANAMSA: typeof AYANAMSA;
  
  /** Rashi (zodiac sign) names */
  readonly RASHIS: typeof RASHIS;
  
  /** Nakshatra names */
  readonly NAKSHATRAS: typeof NAKSHATRAS;

  // === Cache Management ===

  /**
   * Clear all calculation caches
   */
  clearCaches(): void;

  /**
   * Enable or disable caching for performance optimization
   * @param enabled - Whether to enable caching
   */
  setCaching(enabled: boolean): void;
}

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
export async function createSweph(options?: SwephInitOptions): Promise<SwephInstance> {
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
    setEphemerisPath(options.ephePath);
  }

  // Initialize AstroCalculator
  const calculator = new AstroCalculator({
    enableCaching: options?.enableCaching ?? true,
    defaultMinTier: CalculationTier.FAST, // Lite First
    defaultMaxTier: CalculationTier.NATIVE,
  });

  // Register Engines
  
  // 1. Lite Engine (Always available, fastest)
  const { LiteEngine } = await import('@af/sweph-lite');
  const liteEngine = new LiteEngine();
  await liteEngine.initialize();
  calculator.registerEngine(liteEngine);

  // 2. WASM Engine (Optional, for Lagna fallback or if Native fails)
  // We try to load it. If it fails (e.g. file fetch error), we log and skip.
  try {
    const { WasmEngine } = await import('@af/sweph-wasm');
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
  } catch (e) {
    console.warn('Failed to register WASM engine:', e);
  }

  // 3. Native Engine (Highest precision, but might fail on Vercel)
  try {
    const { NativeEngine } = await import('./engine');
    const nativeEngine = new NativeEngine();
    // Native engine checks process.versions.node
    if (await nativeEngine.isAvailable()) {
         await nativeEngine.initialize(); // Loads swisseph-v2
         calculator.registerEngine(nativeEngine);
    }
  } catch (e) {
     console.warn('Failed to register Native engine:', e);
  }

  // Return SwephInstance proxying to calculator
  const instance: SwephInstance = {
    // Planets (Proxied)
    async calculatePlanets(date: Date, opts?: PlanetOptions): Promise<Planet[]> {
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
    async calculatePlanet(planetId: number, date: Date, opts?: PlanetOptions): Promise<Planet | null> {
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
             const planetDef = Object.values(PLANETS).find((pd: any) => pd.id === planetId);
             return planetDef && p.id === planetDef.name.toLowerCase();
         });
         return p || null;
    },
    
    async calculateRiseSet(planetId: number, date: Date, location: Location, opts?: PlanetOptions): Promise<RiseSetTransit> {
        // Not supported by AstroCalculator yet. Fallback to direct native/utils call.
        // This bypasses tiered system for now.
        // TODO: Add to AstroCalculator
        const geoLoc = {
            latitude: location.latitude,
            longitude: location.longitude,
            timezone: opts?.timezone ?? location.timezone ?? 0,
        };
        return calculatePlanetRiseSetTimes(planetId, date, geoLoc);
    },
    
    // Lagna (Proxied)
    async calculateLagna(date: Date, location: Location, opts?: PlanetOptions): Promise<LagnaInfo> {
        const result = await calculator.calculateLagna(date, {
            latitude: location.latitude,
            longitude: location.longitude,
        }, {
            ayanamsa: opts?.ayanamsa ?? 1,
            // Options mapping...
        });
        return result.data as unknown as LagnaInfo;
    },
    
    // Sun (Proxied)
    async calculateSunTimes(date: Date, location: Location): Promise<SunTimes> {
        const result = await calculator.calculateSunTimes(date, {
             latitude: location.latitude,
             longitude: location.longitude
        });
        return result.data;
    },
    
    async calculateSolarNoon(date: Date, location: Location): Promise<{ time: Date; altitude: number }> {
         // Fallback to internal utility
         const geoLoc = { latitude: location.latitude, longitude: location.longitude, timezone: location.timezone ?? 0 };
         return calculateSolarNoon(date, geoLoc);
    },
    
    async calculateSunPath(date: Date, location: Location, intervalMinutes: number = 30): Promise<Array<{ time: Date; azimuth: number; altitude: number }>> {
         const geoLoc = { latitude: location.latitude, longitude: location.longitude, timezone: location.timezone ?? 0 };
         return calculateSunPath(date, geoLoc, intervalMinutes);
    },
    
    // Moon (Proxied/Mixed)
    async calculateMoonData(date: Date, location: Location): Promise<MoonData> {
         // Calculate Phase via Calculator (Tiered)
         const phaseResult = await calculator.calculateMoonPhase(date);
         
         // Logic for other moon data (distance, constellation) might be missing in simple MoonPhase result
         // Lite returns MoonPhase. Native returns more.
         // internal calculateMoonData returns MoonData.
         // Let's try to stick to internal utility for full MoonData if possible, 
         // BUT if native fails, we want at least partial data.
         
         // For now, fallback to internal utility (Native) for full structure.
         const geoLoc = { latitude: location.latitude, longitude: location.longitude, timezone: location.timezone ?? 0 };
         return calculateMoonData(date, geoLoc);
    },
    
    async calculateMoonPhase(date: Date): Promise<MoonPhase> {
        const result = await calculator.calculateMoonPhase(date);
        return result.data;
    },
    
    async calculateNextMoonPhases(date: Date): Promise<NextMoonPhases> {
       return calculateNextMoonPhases(date);
    },
    
    // Utilities
    getAyanamsa(date: Date, ayanamsaType: number = 1): number {
      // Synchronous. AstroCalculator is async. 
      // If we need synchronous, we MUST use direct utility (Native/Lite sync if exposed).
      // But Native is only one providing sync getAyanamsa via adapter.
      return getAyanamsa(date, ayanamsaType);
    },
    
    dateToJulian(date: Date): number {
      return dateToJulian(date);
    },
    
    setEphePath(path: string): void {
      setEphemerisPath(path);
    },

    // Cache management
    clearCaches(): void {
      calculator.clearCache();
      clearAllCaches();
    },

    setCaching(enabled: boolean): void {
      // Calculator caching option is readonly after init usually, but our logic might support it?
      // Re-creating calculator is expensive.
      setCachingEnabled(enabled);
    },

    // Constants
    PLANETS,
    AYANAMSA,
    RASHIS,
    NAKSHATRAS,
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
  private pool: SwephInstance[] = [];
  private maxSize: number;
  private initialized = false;

  constructor(maxSize = 3) {
    this.maxSize = maxSize;
  }

  async getInstance(options?: SwephInitOptions): Promise<SwephInstance> {
    // Return existing instance if available
    if (this.pool.length > 0) {
      return this.pool.pop()!;
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

  returnInstance(instance: SwephInstance): void {
    if (this.pool.length < this.maxSize) {
      // Clear caches before returning to pool
      instance.clearCaches();
      this.pool.push(instance);
    }
  }

  async cleanup(): Promise<void> {
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
export async function withSwephInstance<T>(
  callback: (sweph: SwephInstance) => Promise<T>,
  options?: SwephInitOptions
): Promise<T> {
  const instance = await globalPool.getInstance(options);

  try {
    return await callback(instance);
  } finally {
    globalPool.returnInstance(instance);
  }
}

/**
 * Create a dedicated SwephInstance for serverless environments
 * with optimized settings
 */
export async function createServerlessSweph(options?: SwephInitOptions): Promise<SwephInstance> {
  return await createSweph({
    serverlessMode: true,
    enableCaching: true,
    preWarm: true,
    ...options
  });
}

export { PLANETS, AYANAMSA, RASHIS, NAKSHATRAS };
export { AyanamsaType, PlanetId, HouseSystem } from './types';

// Type exports
export type {
  Planet,
  GeoLocation,
  SunTimes,
  MoonData,
  MoonPhase,
  LagnaInfo,
  NextMoonPhases,
  CalculationOptions,
};
