/**
 * JsonSwephInstance — drop-in compatible with the SwephInstance v2 API.
 *
 * createJsonSweph() returns this object. Callers can use it anywhere a
 * SwephInstance is expected without loading native binaries.
 */

import type { Planet, GeoLocation, LagnaInfo, SunTimes, MoonPhase } from '@af/sweph-core';
import type { JsonSwephOptions } from './types';
import { EphemerisStore } from './loader';
import { JsonEngine } from './engine';
import { getAyanamsa, dateToJD, AYANAMSA_TYPE } from './ayanamsa';

// Minimal types that mirror @af/sweph v2 SwephInstance (subset used in practice)
export interface RiseSetTransit {
    rise: Date | null;
    set: Date | null;
    transit: Date | null;
    transitAltitude?: number;
}

export interface NextMoonPhases {
    newMoon?: Date;
    fullMoon?: Date;
    nextNewMoon?: Date;
}

export interface MoonData {
    illumination: number;
    age: number;
    phase: number;
    phaseName: string;
    distance: number;
    moonrise?: Date | null;
    moonset?: Date | null;
    transit?: Date | null;
}

export interface Location {
    latitude: number;
    longitude: number;
    timezone?: number;
}

export interface PlanetOptions {
    ayanamsa?: number;
    timezone?: number;
    location?: Location;
}

/**
 * The full JSON-based SwephInstance.
 * All methods are async and never throw for missing data — they return
 * empty/null values and log warnings instead.
 */
export class JsonSwephInstance {
    private readonly engine: JsonEngine;
    readonly type = 'json' as const;

    constructor(engine: JsonEngine) {
        this.engine = engine;
    }

    // =========================================================================
    // Planetary calculations
    // =========================================================================

    async calculatePlanets(date: Date, options?: PlanetOptions): Promise<Planet[]> {
        return this.engine.calculatePlanets(date, { ayanamsa: options?.ayanamsa });
    }

    async calculatePlanet(planetId: number, date: Date, options?: PlanetOptions): Promise<Planet | null> {
        const all = await this.calculatePlanets(date, options);
        return all.find((p) => p.id === String(planetId)) ?? null;
    }

    async calculateRiseSet(
        _planetId: number,
        _date: Date,
        _location: Location,
        _options?: PlanetOptions
    ): Promise<RiseSetTransit> {
        // Rise/set for individual planets requires SWEPH precision.
        // JSON engine does not support this — return null to signal callers to escalate.
        return { rise: null, set: null, transit: null };
    }

    // =========================================================================
    // Lagna & houses
    // =========================================================================

    async calculateLagna(date: Date, location: Location, options?: PlanetOptions): Promise<LagnaInfo> {
        return this.engine.calculateLagna(
            date,
            { latitude: location.latitude, longitude: location.longitude },
            { ayanamsa: options?.ayanamsa }
        );
    }

    // =========================================================================
    // Sun calculations
    // =========================================================================

    async calculateSunTimes(date: Date, location: Location): Promise<SunTimes> {
        return this.engine.calculateSunTimes(date, {
            latitude: location.latitude,
            longitude: location.longitude,
        });
    }

    async calculateSolarNoon(
        date: Date,
        location: Location
    ): Promise<{ time: Date; altitude: number }> {
        const times = await this.calculateSunTimes(date, location);
        return { time: times.solarNoon, altitude: 0 };
    }

    async calculateSunPath(
        _date: Date,
        _location: Location,
        _intervalMinutes?: number
    ): Promise<Array<{ time: Date; azimuth: number; altitude: number }>> {
        // Full sun path requires azimuth/altitude — not supported by JSON engine.
        return [];
    }

    // =========================================================================
    // Moon calculations
    // =========================================================================

    async calculateMoonData(date: Date, _location: Location): Promise<MoonData> {
        const phase = await this.engine.calculateMoonPhase(date);
        return {
            illumination: phase.illumination,
            age: phase.age,
            phase: phase.phase,
            phaseName: phase.phaseName,
            distance: 0,
            moonrise: null,
            moonset: null,
            transit: null,
        };
    }

    async calculateMoonPhase(date: Date): Promise<MoonPhase> {
        return this.engine.calculateMoonPhase(date);
    }

    async calculateNextMoonPhases(date: Date): Promise<NextMoonPhases> {
        // Walk forward day by day looking for phase crossings — good enough for
        // display purposes, not sub-minute accurate like SWEPH.
        const phase = await this.calculateMoonPhase(date);
        let newMoon: Date | undefined;
        let fullMoon: Date | undefined;
        let nextNewMoon: Date | undefined;

        let prevPhase = phase.phase;
        for (let i = 1; i <= 45; i++) {
            const d = new Date(date.getTime() + i * 86_400_000);
            const p = await this.calculateMoonPhase(d);
            const cur = p.phase;

            if (!fullMoon && prevPhase < 180 && cur >= 180) fullMoon = d;
            if (!newMoon && prevPhase > 10 && cur < 10) newMoon = d;
            if (newMoon && !nextNewMoon && i > 15 && prevPhase > 10 && cur < 10) nextNewMoon = d;

            prevPhase = cur;
            if (newMoon && fullMoon) break;
        }

        return { newMoon, fullMoon, nextNewMoon };
    }

    // =========================================================================
    // Utility
    // =========================================================================

    getAyanamsa(date: Date, ayanamsaType?: number): number {
        return getAyanamsa(date, ayanamsaType ?? AYANAMSA_TYPE.LAHIRI);
    }

    dateToJulian(date: Date): number {
        return dateToJD(date);
    }

    setEphePath(_path: string): void {
        // No-op — JSON engine has no ephemeris files to locate
    }

    clearCaches(): void {
        // Module-level caches are cleared by reloading the module.
        // In practice this is a no-op — Lambda containers are ephemeral anyway.
    }

    setCaching(_enabled: boolean): void {
        // Caching is always on for the JSON engine (it's the whole point).
    }
}
