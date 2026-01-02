/**
 * Legacy Compatibility Layer for @af/sweph
 * 
 * This file provides backwards-compatible exports for code migrating
 * from the old @astrofusion/sweph-* packages.
 */

import {
  calculatePlanets,
  calculateSinglePlanet,
  calculatePlanetRiseSetTimes,
} from './planets';

import { calculateLagna } from './houses';

import {
  calculateSunTimes,
  calculateSunPath,
} from './sun';

import {
  calculateMoonData,
  calculateMoonPhase,
  calculateNextMoonPhases,
} from './moon';

import { getAyanamsa } from './utils';

import type {
  Planet,
  LagnaInfo,
  SunTimes,
  MoonData,
  GeoLocation,
  CalculationOptions,
  NextMoonPhases,
} from './types';

import { initializeSweph as initSweph, getNativeModule } from './utils';

// ===== Legacy Type Aliases =====

/**
 * @deprecated Use `Planet` from @af/sweph instead
 */
export type LegacyPlanet = Planet;

/**
 * @deprecated Use `SunTimes` from @af/sweph instead
 */
export type SunTimesResult = SunTimes;

/**
 * @deprecated Use `MoonData` from @af/sweph instead
 */
export type MoonTimesResult = MoonData;

/**
 * @deprecated Use `LagnaInfo` from @af/sweph instead
 */
export type LegacyLagnaInfo = LagnaInfo;

// ===== Legacy Interface =====

/**
 * PlanetaryCalculationProvider interface for legacy compatibility
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export interface PlanetaryCalculationProvider {
  calculateAllPlanetPositions(
    date: Date,
    timeZoneOffset: number,
    ayanamsa?: number
  ): Promise<Planet[]>;

  calculateLagna(
    date: Date,
    timeZoneOffset: number,
    latitude: number,
    longitude: number,
    ayanamsa?: number
  ): Promise<LagnaInfo>;

  calculateSunTimes(
    date: Date,
    latitude: number,
    longitude: number,
    timeZoneOffset: number
  ): Promise<SunTimes>;

  calculateMoonTimes(
    date: Date,
    latitude: number,
    longitude: number,
    timeZoneOffset: number
  ): Promise<MoonData>;

  calculatePlanetRiseSetTimes(
    planetId: number,
    date: Date,
    latitude: number,
    longitude: number,
    timeZoneOffset: number
  ): Promise<{ rise: Date | null; set: Date | null }>;

  calculateMoonPosition(
    date: Date,
    latitude: number,
    longitude: number,
    timeZoneOffset: number
  ): Promise<Planet>;

  calculateMoonPhase(
    date: Date
  ): Promise<{ phase: number; illumination: number; age: number; phaseName: string }>;

  calculateMoonTransit(
    date: Date,
    latitude: number,
    longitude: number,
    timeZoneOffset: number
  ): Promise<{ transit: Date | null; altitude: number; distance: number }>;

  calculateNextMoonPhases(
    date: Date
  ): Promise<NextMoonPhases>;

  calculateDailySunPath(
    date: Date,
    latitude: number,
    longitude: number,
    timeZoneOffset: number
  ): Promise<{ time: Date; azimuth: number; altitude: number }[]>;
}

/**
 * SwephAdapter interface alias for legacy compatibility
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export type SwephAdapter = PlanetaryCalculationProvider;

// ===== Legacy Factory Functions =====

/**
 * Creates a PlanetaryCalculationProvider instance
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export function createPlanetaryCalculator(_options?: any): PlanetaryCalculationProvider {
  return createSwephCalculator();
}

/**
 * Creates a SwephCalculator instance (legacy compatibility)
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export function createSwephCalculator(): PlanetaryCalculationProvider {
  return {
    async calculateAllPlanetPositions(
      date: Date,
      timeZoneOffset: number,
      ayanamsa: number = 1
    ): Promise<Planet[]> {
      // Adjust date for timezone
      const utcDate = new Date(date.getTime() - timeZoneOffset * 60 * 60 * 1000);
      return calculatePlanets(utcDate, { ayanamsa });
    },

    async calculateLagna(
      date: Date,
      timeZoneOffset: number,
      latitude: number,
      longitude: number,
      ayanamsa: number = 1
    ): Promise<LagnaInfo> {
      return calculateLagna(date, { latitude, longitude, timezone: timeZoneOffset }, { ayanamsa });
    },

    async calculateSunTimes(
      date: Date,
      latitude: number,
      longitude: number,
      timeZoneOffset: number
    ): Promise<SunTimes> {
      return calculateSunTimes(date, { latitude, longitude, timezone: timeZoneOffset });
    },

    async calculateMoonTimes(
      date: Date,
      latitude: number,
      longitude: number,
      timeZoneOffset: number
    ): Promise<MoonData> {
      return calculateMoonData(date, { latitude, longitude, timezone: timeZoneOffset });
    },

    async calculatePlanetRiseSetTimes(
      planetId: number,
      date: Date,
      latitude: number,
      longitude: number,
      timeZoneOffset: number
    ): Promise<{ rise: Date | null; set: Date | null }> {
      return calculatePlanetRiseSetTimes(planetId, date, { latitude, longitude, timezone: timeZoneOffset });
    },

    async calculateMoonPosition(
      date: Date,
      latitude: number,
      longitude: number,
      timeZoneOffset: number
    ): Promise<Planet> {
      // Calculate Moon (id 1) using implementation that supports Az/Alt
      const utcDate = new Date(date.getTime() - timeZoneOffset * 60 * 60 * 1000);
      const result = await calculateSinglePlanet(1, utcDate, { 
        ayanamsa: 1, // Default ayanamsa
        location: { latitude, longitude, timezone: timeZoneOffset }
      });
      if (!result) throw new Error('Failed to calculate Moon position');
      return result;
    },

    async calculateMoonTransit(
      date: Date,
      latitude: number,
      longitude: number,
      timeZoneOffset: number
    ): Promise<{ transit: Date | null; altitude: number; distance: number }> {
        const result = calculatePlanetRiseSetTimes(
            1, // Moon
            date,
            { latitude, longitude, timezone: timeZoneOffset }
        );
        return {
            transit: result.transit,
            altitude: result.transitAltitude,
            distance: result.transitDistance
        };
    },

    async calculateMoonPhase(
      date: Date
    ): Promise<{ phase: number; illumination: number; age: number; phaseName: string }> {
      return calculateMoonPhase(date);
    },



    async calculateNextMoonPhases(
      date: Date
    ): Promise<NextMoonPhases> {
      return calculateNextMoonPhases(date);
    },

    async calculateDailySunPath(
      date: Date,
      latitude: number,
      longitude: number,
      timeZoneOffset: number
    ): Promise<{ time: Date; azimuth: number; altitude: number }[]> {
        return calculateSunPath(date, { latitude, longitude, timezone: timeZoneOffset });
    }
  };
}

/**
 * Creates a SwephAdapter instance (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
export function createSwephAdapter(): SwephAdapter {
  return createSwephCalculator();
}

/**
 * Creates a Node adapter (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
export function createNodeAdapter(): SwephAdapter {
  return createSwephCalculator();
}

/**
 * Initialize Swiss Ephemeris (legacy compatibility)
 * @deprecated The library auto-initializes; this is now a no-op
 */
export function initializeSweph(): void {
  initSweph();
}

/**
 * Register an adapter (legacy compatibility - no-op)
 * @deprecated Adapters are no longer needed; use direct functions
 */
export function registerAdapter(_platform: string, _adapter: any): void {
  // No-op - adapters are no longer used in the new architecture
}

/**
 * Calculate kundali page data (legacy compatibility)
 * @deprecated Use individual calculation functions instead
 */
export async function calculateKundaliPageData(
  birthDate: Date,
  location: GeoLocation,
  options: CalculationOptions = {}
): Promise<{
  planets: Planet[];
  lagna: LagnaInfo;
  sunTimes: SunTimes;
  moonData: MoonData;
}> {
  const [planets, lagna, sunTimes, moonData] = await Promise.all([
    calculatePlanets(birthDate, options),
    calculateLagna(birthDate, location, options),
    calculateSunTimes(birthDate, location),
    calculateMoonData(birthDate, location),
  ]);

  return { planets, lagna, sunTimes, moonData };
}
