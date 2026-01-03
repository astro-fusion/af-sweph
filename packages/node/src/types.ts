/**
 * Type Definitions for @af/sweph-node
 * Re-exported from @af/sweph-core with local extensions
 */

import type { CalculationOptions as CoreCalculationOptions } from '@af/sweph-core';

export type {
  CalcResult,
  RiseTransResult,
  AzAltResult,
  GeoLocation,
  Planet,
  SunTimes,
  MoonData,
  MoonPhase,
  PlanetRiseSetTimes,
  ISwephAdapter,
  ISwephInstance
} from '@af/sweph-core';

export {
  PlanetId,
  AyanamsaType,
  HouseSystem
} from '@af/sweph-core';

/**
 * Extended calculation options for Node.js implementation
 */
export interface CalculationOptions extends CoreCalculationOptions {
  includeSpeed?: boolean;
}

/**
 * Lagna (Ascendant) Information
 */
export interface LagnaInfo {
  longitude: number;
  rasi: number;
  rasiDegree?: number;
  degree?: number; // Legacy alias
  nakshatra?: number;
  nakshatraPada?: number;
  houses: number[];
  ayanamsaValue?: number;
  lagna?: number; // Legacy alias
  lagnaRasi?: number; // Legacy alias
  lagnaDegree?: number; // Legacy alias
  julianDay?: number;
}

/**
 * Solar Noon Result
 */
export interface SolarNoonResult {
  time: Date;
  altitude: number;
  azimuth?: number;
}

/**
 * Next Moon Phases
 */
export interface NextMoonPhases {
  newMoon: Date | null;
  firstQuarter: Date | null;
  fullMoon: Date | null;
  lastQuarter: Date | null;
  nextNewMoon?: Date | null;
}

// Legacy compatibility types
export type PlanetaryCalculationProvider = any;
export type SwephAdapter = any;
export type SunTimesResult = any;
export type MoonTimesResult = any;
export type LegacyPlanet = any;
export type LegacyLagnaInfo = any;
