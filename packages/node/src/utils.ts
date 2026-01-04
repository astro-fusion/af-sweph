/**
 * Utility Functions for @af/sweph-node
 * 
 * This module provides shared utility functions for astronomical calculations.
 * It lazily loads the native module to prevent webpack bundling issues.
 */

import path from 'path';
import { JULIAN_UNIX_EPOCH } from './constants';
import * as coreUtils from '@af/sweph-core';
import { loadNativeBinary } from './native-loader';

// Re-export pure utilities from core
export {
  normalizeLongitude,
  getRashi,
  getRashiDegree,
  isRetrograde,
  getNakshatra,
  julianToDate,
  formatLongitude
} from '@af/sweph-core';

// Ephemeris path and initialization state
let ephemerisPath: string | null = null;
let isInitialized = false;
let cachedNativeModule: any = null;

// Serverless-aware result caching
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class ServerlessCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;
  private enabled: boolean;

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.enabled = process.env.SWEPH_DISABLE_CACHE !== 'true';
  }

  set(key: string, value: T, ttl?: number): void {
    if (!this.enabled) return;

    // Simple LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL
    });
  }

  get(key: string): T | undefined {
    if (!this.enabled) return undefined;

    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }
}

// Global cache instances for different calculation types
const planetCache = new ServerlessCache<any>();
const sunCache = new ServerlessCache<any>();
const moonCache = new ServerlessCache<any>();
const lagnaCache = new ServerlessCache<any>();

/**
 * Generate cache key for planetary calculations
 */
export function getPlanetCacheKey(date: Date, options: any): string {
  return `planet_${date.getTime()}_${JSON.stringify(options)}`;
}

/**
 * Generate cache key for sun calculations
 */
export function getSunCacheKey(date: Date, location?: any): string {
  return `sun_${date.getTime()}_${location ? `${location.latitude}_${location.longitude}` : 'global'}`;
}

/**
 * Generate cache key for moon calculations
 */
export function getMoonCacheKey(date: Date): string {
  return `moon_${date.getTime()}`;
}

/**
 * Generate cache key for lagna calculations
 */
export function getLagnaCacheKey(date: Date, location: any, options: any): string {
  return `lagna_${date.getTime()}_${location.latitude}_${location.longitude}_${JSON.stringify(options)}`;
}

/**
 * Clear all caches (useful for memory management in serverless)
 */
export function clearAllCaches(): void {
  planetCache.clear();
  sunCache.clear();
  moonCache.clear();
  lagnaCache.clear();
}

/**
 * Enable/disable caching globally
 */
export function setCachingEnabled(enabled: boolean): void {
  planetCache.setEnabled(enabled);
  sunCache.setEnabled(enabled);
  moonCache.setEnabled(enabled);
  lagnaCache.setEnabled(enabled);
}

/**
 * Get the native Swiss Ephemeris module
 * Uses lazy loading to prevent webpack from bundling native modules
 * 
 * @returns Swiss Ephemeris native module instance
 * @throws Error if module not initialized
 * @internal
 */
export function getNativeModule(): any {
  if (!cachedNativeModule) {
    throw new Error(
      'Swiss Ephemeris module not initialized. ' +
      'Call await initializeSweph() before using calculation functions.'
    );
  }
  return cachedNativeModule;
}

/**
 * Initialize the Swiss Ephemeris system
 * Must be called (and awaited) before using any calculation functions
 * 
 * @param options - Optional configuration
 * @throws Error if initialization fails
 */
export async function initializeSweph(options?: any): Promise<void> {
  if (isInitialized && cachedNativeModule) return;

  cachedNativeModule = await loadNativeBinary(options);

  // Try to find ephemeris files
  const searchPaths = [
    ephemerisPath,
    path.resolve(__dirname, '..', 'ephe'),
    path.resolve(process.cwd(), 'ephe'),
    path.resolve(process.cwd(), 'lib', 'ephe'),
    path.resolve(process.cwd(), 'public', 'ephe'),
  ].filter(Boolean) as string[];

  for (const ephePath of searchPaths) {
    try {
      // Dynamic require for fs to avoid webpack bundling
      const dynamicRequire = new Function('moduleName', 'return require(moduleName)');
      const fs = dynamicRequire('fs');
      if (fs.existsSync(ephePath)) {
        cachedNativeModule.swe_set_ephe_path(ephePath);
        ephemerisPath = ephePath;
        break;
      }
    } catch {
      // Ignore and try next path
    }
  }

  isInitialized = true;
}

/**
 * Set custom path to Swiss Ephemeris data files
 * @param customPath - Directory path containing ephemeris files (.se1 files)
 */
export function setEphemerisPath(customPath: string): void {
  ephemerisPath = customPath;
  if (cachedNativeModule) {
    try {
      cachedNativeModule.swe_set_ephe_path(customPath);
    } catch {
      // Module might not support this method in all environments
    }
  }
}

/**
 * Get the ayanamsa correction value for sidereal calculations
 */
export function getAyanamsa(date: Date, ayanamsaType: number = 1): number {
  const sweph = getNativeModule();
  const jd = dateToJulian(date);
  sweph.swe_set_sid_mode(ayanamsaType, 0, 0);
  return sweph.swe_get_ayanamsa(jd);
}

/**
 * Convert JavaScript Date to Julian Day number
 */
export function dateToJulian(date: Date): number {
  const sweph = getNativeModule();

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600;

  return sweph.swe_julday(year, month, day, hour, 1);
}

/**
 * Get Julian Day for a date (alias for dateToJulian)
 */
export function getJulianDay(date: Date): number {
  return dateToJulian(date);
}


/**
 * Helper to call swe_rise_trans with fallback for different signatures
 * @internal
 */
export function callRiseTrans(
  jd: number,
  id: number,
  flag: number,
  location: { longitude: number; latitude: number }
): any {
  const sweph = getNativeModule();
  const SEFLG_SWIEPH = sweph.SEFLG_SWIEPH || 2;

  try {
    return sweph.swe_rise_trans(
      jd, id, '', SEFLG_SWIEPH, flag,
      location.longitude, location.latitude, 0,
      0, 0
    );
  } catch (error: any) {
    if (error && error.message && error.message.includes('Wrong type of arguments')) {
      return sweph.swe_rise_trans(
        jd, id, '', SEFLG_SWIEPH, flag,
        [location.longitude, location.latitude, 0],
        0, 0
      );
    }
    throw error;
  }
}

/**
 * Helper to call swe_azalt with fallback for different signatures
 * @internal
 */
export function callAzAlt(
  jd: number,
  location: { longitude: number; latitude: number },
  planetPos: { longitude: number; latitude: number; distance: number }
): any {
  const sweph = getNativeModule();

  const geopos = [location.longitude, location.latitude, 0];
  const xin = [planetPos.longitude, planetPos.latitude, planetPos.distance];
  const errors: string[] = [];

  try {
    return sweph.swe_azalt(
      jd,
      sweph.SE_EQU2HOR || 0x0800,
      geopos,
      0,
      10,
      xin
    );
  } catch (error: any) {
    errors.push(`Attempt 1 failed: ${error.message}`);
  }

  try {
    return sweph.swe_azalt(jd, geopos, xin);
  } catch (error: any) {
    errors.push(`Attempt 2 failed: ${error.message}`);
  }

  try {
    return sweph.swe_azalt(
      jd,
      sweph.SE_EQU2HOR || 0x0800,
      location.longitude, location.latitude, 0,
      0, 10,
      planetPos.longitude, planetPos.latitude, planetPos.distance
    );
  } catch (error: any) {
    errors.push(`Attempt 3 failed: ${error.message}`);
  }

  throw new Error(`swe_azalt call failed after multiple attempts. Errors: ${errors.join('; ')}`);
}
