/**
 * NativeEngine - Node.js Native Swiss Ephemeris Engine
 * 
 * Implements ICalculationEngine using the native C++ module (via swisseph-v2 or existing functions).
 * Provides highest accuracy and full feature support.
 */

import type {
    ICalculationEngine,
    Planet,
    GeoLocation,
    SunTimes,
    MoonPhase,
    LagnaInfo,
    CalculationOptions,
} from '@af/sweph-core';
import {
    CalculationTier,
    EngineFeatures
} from '@af/sweph-core';
import {
    calculatePlanets,
} from './planets';
import { calculateLagna } from './houses';
import { calculateSunTimes } from './sun';
import { calculateMoonPhase } from './moon';
import { getAyanamsa, initializeSweph, setEphemerisPath } from './utils';

export class NativeEngine implements ICalculationEngine {
    readonly tier = CalculationTier.NATIVE;
    readonly name = 'native';
    
    readonly supportedFeatures = new Set([
        EngineFeatures.PLANETS,
        EngineFeatures.SUN_TIMES,
        EngineFeatures.MOON_PHASE,
        EngineFeatures.AYANAMSA,
        EngineFeatures.LAGNA,
        EngineFeatures.HOUSES,
        EngineFeatures.MOON_TIMES,
        EngineFeatures.PLANET_RISE_SET
    ]);
    
    private initialized = false;

    async isAvailable(): Promise<boolean> {
        // Native engine is available if we are in Node.js
        return typeof process !== 'undefined' && 
               process.versions != null && 
               process.versions.node != null;
    }

    async initialize(): Promise<void> {
        if (!this.initialized) {
            await initializeSweph();
            this.initialized = true;
        }
    }

    dispose(): void {
        // Native module stays loaded
    }

    async calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]> {
        return calculatePlanets(date, options) as unknown as Promise<Planet[]>;
    }

    async calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): Promise<LagnaInfo> {
        return calculateLagna(date, location, options) as unknown as Promise<LagnaInfo>;
    }

    async calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes> {
        return calculateSunTimes(date, location);
    }

    async calculateMoonPhase(date: Date): Promise<MoonPhase> {
        return calculateMoonPhase(date);
    }

    getAyanamsa(date: Date, type: number = 1): number {
        return getAyanamsa(date, type);
    }

    setEphePath(path: string) {
        setEphemerisPath(path);
    }
}
