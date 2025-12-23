/**
 * @AstroFusion/sweph - Swiss Ephemeris for Vedic Astrology
 * 
 * This is the main entry point for the library.
 * All public APIs are exported from here.
 */

// Types
export * from './types';

// Core calculation functions
export {
  calculatePlanets,
  calculateSinglePlanet,
  calculatePlanetRiseSetTimes,
} from './planets';

export {
  calculateLagna,
  calculateHouses,
} from './houses';

export {
  calculateSunTimes,
  calculateSolarNoon,
  calculateSunPath,
} from './sun';

export {
  calculateMoonData,
  calculateMoonPhase,
  calculateNextMoonPhases,
} from './moon';

// Utility functions
export {
  getAyanamsa,
  setEphemerisPath,
  getJulianDay,
  dateToJulian,
  julianToDate,
} from './utils';

// Constants
export {
  PLANETS,
  AYANAMSA,
  HOUSE_SYSTEMS,
  RASHIS,
  NAKSHATRAS,
  VEDIC_PLANET_ORDER,
} from './constants';

// Legacy compatibility exports (for migration from @astrofusion/sweph-*)
export {
  // Factory functions
  createSwephCalculator,
  createPlanetaryCalculator,
  createSwephAdapter,
  createNodeAdapter,
  initializeSweph,
  registerAdapter,
  calculateKundaliPageData,
  // Types
  type PlanetaryCalculationProvider,
  type SwephAdapter,
  type SunTimesResult,
  type MoonTimesResult,
  type LegacyPlanet,
  type LegacyLagnaInfo,
} from './legacy';
