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

import { calculateLagna, calculateHouses } from './houses';
import { calculateSunTimes, calculateSolarNoon, calculateSunPath } from './sun';
import { calculateMoonData, calculateMoonPhase, calculateNextMoonPhases } from './moon';
import { initializeSweph, setEphemerisPath, getAyanamsa, dateToJulian } from './utils';
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
   * @returns Rise, set, and transit times
   */
  calculateRiseSet(planetId: number, date: Date, location: Location): Promise<RiseSetTransit>;

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
  // Auto-initialize the native module
  await initializeSweph();
  
  // Set ephemeris path if provided
  if (options?.ephePath) {
    setEphemerisPath(options.ephePath);
  }
  
  // Create the instance
  const instance: SwephInstance = {
    // Planets
    async calculatePlanets(date: Date, opts?: PlanetOptions): Promise<Planet[]> {
      const calcOpts: CalculationOptions = {
        ayanamsa: opts?.ayanamsa ?? 1,
        location: opts?.location ? {
          latitude: opts.location.latitude,
          longitude: opts.location.longitude,
          timezone: opts.location.timezone ?? opts?.timezone ?? 0,
        } : undefined,
      };
      
      // Handle timezone offset
      const tzOffset = opts?.timezone ?? opts?.location?.timezone ?? 0;
      const utcDate = new Date(date.getTime() - tzOffset * 60 * 60 * 1000);
      
      return calculatePlanets(utcDate, calcOpts);
    },
    
    async calculatePlanet(planetId: number, date: Date, opts?: PlanetOptions): Promise<Planet | null> {
      const calcOpts: CalculationOptions = {
        ayanamsa: opts?.ayanamsa ?? 1,
        location: opts?.location ? {
          latitude: opts.location.latitude,
          longitude: opts.location.longitude,
          timezone: opts.location.timezone ?? opts?.timezone ?? 0,
        } : undefined,
      };
      
      const tzOffset = opts?.timezone ?? opts?.location?.timezone ?? 0;
      const utcDate = new Date(date.getTime() - tzOffset * 60 * 60 * 1000);
      
      return calculateSinglePlanet(planetId, utcDate, calcOpts);
    },
    
    async calculateRiseSet(planetId: number, date: Date, location: Location): Promise<RiseSetTransit> {
      const geoLoc = {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone ?? 0,
      };
      const result = calculatePlanetRiseSetTimes(planetId, date, geoLoc);
      return {
        rise: result.rise,
        set: result.set,
        transit: result.transit,
        transitAltitude: result.transitAltitude,
      };
    },
    
    // Lagna
    async calculateLagna(date: Date, location: Location, opts?: PlanetOptions): Promise<LagnaInfo> {
      const geoLoc = {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone ?? 0,
      };
      const calcOpts: CalculationOptions = {
        ayanamsa: opts?.ayanamsa ?? 1,
      };
      return calculateLagna(date, geoLoc, calcOpts);
    },
    
    // Sun
    async calculateSunTimes(date: Date, location: Location): Promise<SunTimes> {
      const geoLoc = {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone ?? 0,
      };
      return calculateSunTimes(date, geoLoc);
    },
    
    async calculateSolarNoon(date: Date, location: Location): Promise<{ time: Date; altitude: number }> {
      const geoLoc = {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone ?? 0,
      };
      return calculateSolarNoon(date, geoLoc);
    },
    
    async calculateSunPath(date: Date, location: Location, intervalMinutes: number = 30): Promise<Array<{ time: Date; azimuth: number; altitude: number }>> {
      const geoLoc = {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone ?? 0,
      };
      return calculateSunPath(date, geoLoc);
    },
    
    // Moon
    async calculateMoonData(date: Date, location: Location): Promise<MoonData> {
      const geoLoc = {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone ?? 0,
      };
      return calculateMoonData(date, geoLoc);
    },
    
    async calculateMoonPhase(date: Date): Promise<MoonPhase> {
      return calculateMoonPhase(date);
    },
    
    async calculateNextMoonPhases(date: Date): Promise<NextMoonPhases> {
      return calculateNextMoonPhases(date);
    },
    
    // Utilities
    getAyanamsa(date: Date, ayanamsaType: number = 1): number {
      return getAyanamsa(date, ayanamsaType);
    },
    
    dateToJulian(date: Date): number {
      return dateToJulian(date);
    },
    
    setEphePath(path: string): void {
      setEphemerisPath(path);
    },
    
    // Constants
    PLANETS,
    AYANAMSA,
    RASHIS,
    NAKSHATRAS,
  };
  
  // Optional pre-warming
  if (options?.preWarm) {
    try {
      await instance.calculatePlanets(new Date(), { ayanamsa: 1 });
    } catch {
      // Pre-warm failure is not critical
    }
  }
  
  return instance;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

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
