/**
 * Legacy Compatibility Layer for @af/sweph
 *
 * This file provides backwards-compatible exports for code migrating
 * from the old @astrofusion/sweph-* packages.
 */
import type { Planet, LagnaInfo, SunTimes, MoonData, GeoLocation, CalculationOptions, NextMoonPhases } from './types';
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
/**
 * PlanetaryCalculationProvider interface for legacy compatibility
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export interface PlanetaryCalculationProvider {
    calculateAllPlanetPositions(date: Date, timeZoneOffset: number, ayanamsa?: number): Promise<Planet[]>;
    calculateLagna(date: Date, timeZoneOffset: number, latitude: number, longitude: number, ayanamsa?: number): Promise<LagnaInfo>;
    calculateSunTimes(date: Date, latitude: number, longitude: number, timeZoneOffset: number): Promise<SunTimes>;
    calculateMoonTimes(date: Date, latitude: number, longitude: number, timeZoneOffset: number): Promise<MoonData>;
    calculatePlanetRiseSetTimes(date: Date, planetId: number, latitude: number, longitude: number, timeZoneOffset: number): Promise<{
        rise: Date | null;
        set: Date | null;
    }>;
    calculateMoonPosition(date: Date, timeZoneOffset: number, ayanamsa?: number): Promise<Planet>;
    calculateMoonPhase(date: Date): Promise<{
        phase: number;
        illumination: number;
        age: number;
        phaseName: string;
    }>;
    calculateMoonTransit(date: Date, latitude: number, longitude: number, timeZoneOffset: number): Promise<MoonData>;
    calculateNextMoonPhases(date: Date): Promise<NextMoonPhases>;
    calculateDailySunPath(date: Date, latitude: number, longitude: number, timeZoneOffset: number): Promise<SunTimes>;
}
/**
 * SwephAdapter interface alias for legacy compatibility
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export type SwephAdapter = PlanetaryCalculationProvider;
/**
 * Creates a PlanetaryCalculationProvider instance
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export declare function createPlanetaryCalculator(): PlanetaryCalculationProvider;
/**
 * Creates a SwephCalculator instance (legacy compatibility)
 * @deprecated Use the direct calculation functions from @af/sweph instead
 */
export declare function createSwephCalculator(): PlanetaryCalculationProvider;
/**
 * Creates a SwephAdapter instance (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
export declare function createSwephAdapter(): SwephAdapter;
/**
 * Creates a Node adapter (legacy alias)
 * @deprecated Use createSwephCalculator or direct functions instead
 */
export declare function createNodeAdapter(): SwephAdapter;
/**
 * Initialize Swiss Ephemeris (legacy compatibility)
 * @deprecated The library auto-initializes; this is now a no-op
 */
export declare function initializeSweph(): void;
/**
 * Register an adapter (legacy compatibility - no-op)
 * @deprecated Adapters are no longer needed; use direct functions
 */
export declare function registerAdapter(_platform: string, _adapter: any): void;
/**
 * Calculate kundali page data (legacy compatibility)
 * @deprecated Use individual calculation functions instead
 */
export declare function calculateKundaliPageData(birthDate: Date, location: GeoLocation, options?: CalculationOptions): Promise<{
    planets: Planet[];
    lagna: LagnaInfo;
    sunTimes: SunTimes;
    moonData: MoonData;
}>;
//# sourceMappingURL=legacy.d.ts.map