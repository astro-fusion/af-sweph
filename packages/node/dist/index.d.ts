/**
 * @AstroFusion/sweph - Swiss Ephemeris for Vedic Astrology
 *
 * This is the main entry point for the library.
 *
 * ## v2 API (Recommended)
 * ```typescript
 * import { createSweph } from '@af/sweph';
 *
 * const sweph = await createSweph();
 * const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
 * ```
 *
 * ## Legacy API (Deprecated)
 * ```typescript
 * import { initializeSweph, createSwephAdapter } from '@af/sweph';
 *
 * await initializeSweph();
 * const adapter = await createSwephAdapter();
 * ```
 */
export { createSweph, type SwephInstance, type SwephInitOptions, type Location, type PlanetOptions, type AstroOptions, type RiseSetTransit, } from './v2';
export { calculatePlanets, calculateSinglePlanet, calculatePlanetRiseSetTimes, } from './planets';
export { calculateLagna, calculateHouses, } from './houses';
export { calculateSunTimes, calculateSolarNoon, calculateSunPath, } from './sun';
export { calculateMoonData, calculateMoonPhase, calculateNextMoonPhases, } from './moon';
export { getAyanamsa, setEphemerisPath, getJulianDay, dateToJulian, julianToDate, getNativeModule, initializeSweph, } from './utils';
export { getPlatformInfo, hasPrebuilds, getSupportedPlatforms, } from './native-loader';
export { PLANETS, AYANAMSA, HOUSE_SYSTEMS, RASHIS, NAKSHATRAS, VEDIC_PLANET_ORDER, } from './constants';
export type { Planet, GeoLocation, SunTimes, MoonData, MoonPhase, LagnaInfo, NextMoonPhases, CalculationOptions, } from './types';
export { PlanetId, AyanamsaType, HouseSystem, } from './types';
export { 
/** @deprecated Use createSweph() instead */
createSwephCalculator, 
/** @deprecated Use createSweph() instead */
createPlanetaryCalculator, 
/** @deprecated Use createSweph() instead */
createSwephAdapter, 
/** @deprecated Use createSweph() instead */
createNodeAdapter, 
/** @deprecated No longer needed - createSweph() auto-initializes */
registerAdapter, 
/** @deprecated Use individual calculation methods */
calculateKundaliPageData, type PlanetaryCalculationProvider, type SwephAdapter, type SunTimesResult, type MoonTimesResult, type LegacyPlanet, type LegacyLagnaInfo, } from './legacy';
//# sourceMappingURL=index.d.ts.map