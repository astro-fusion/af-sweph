/**
 * Factory function for creating LiteEngine instances
 */

import { LiteEngine } from './engine';
import type { Planet, CalculationOptions, MoonPhase, SunTimes, GeoLocation } from '@af/sweph-core';

/**
 * Create a ready-to-use Lite calculation instance
 * 
 * @example
 * ```typescript
 * import { createLiteSweph } from '@af/sweph-lite';
 * 
 * const sweph = await createLiteSweph();
 * const planets = await sweph.calculatePlanets(new Date());
 * ```
 */
export async function createLiteSweph(): Promise<{
    calculatePlanets: (date: Date, options?: CalculationOptions) => Promise<Planet[]>;
    calculateSunTimes: (date: Date, location: GeoLocation) => Promise<SunTimes>;
    calculateMoonPhase: (date: Date) => Promise<MoonPhase>;
    getAyanamsa: (date: Date, type?: number) => number;
}> {
    const engine = new LiteEngine();
    await engine.initialize();
    
    return {
        calculatePlanets: (date, options) => engine.calculatePlanets(date, options),
        calculateSunTimes: (date, location) => engine.calculateSunTimes(date, location),
        calculateMoonPhase: (date) => engine.calculateMoonPhase(date),
        getAyanamsa: (date, type) => engine.getAyanamsa(date, type),
    };
}
