/**
 * JsonSwephInstance — drop-in compatible with the SwephInstance v2 API.
 *
 * createJsonSweph() returns this object. Callers can use it anywhere a
 * SwephInstance is expected without loading native binaries.
 */
import type { Planet, LagnaInfo, SunTimes, MoonPhase } from '@af/sweph-core';
import { JsonEngine } from './engine';
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
export declare class JsonSwephInstance {
    private readonly engine;
    readonly type: "json";
    constructor(engine: JsonEngine);
    calculatePlanets(date: Date, options?: PlanetOptions): Promise<Planet[]>;
    calculatePlanet(planetId: number, date: Date, options?: PlanetOptions): Promise<Planet | null>;
    calculateRiseSet(_planetId: number, _date: Date, _location: Location, _options?: PlanetOptions): Promise<RiseSetTransit>;
    calculateLagna(date: Date, location: Location, options?: PlanetOptions): Promise<LagnaInfo>;
    calculateSunTimes(date: Date, location: Location): Promise<SunTimes>;
    calculateSolarNoon(date: Date, location: Location): Promise<{
        time: Date;
        altitude: number;
    }>;
    calculateSunPath(_date: Date, _location: Location, _intervalMinutes?: number): Promise<Array<{
        time: Date;
        azimuth: number;
        altitude: number;
    }>>;
    calculateMoonData(date: Date, _location: Location): Promise<MoonData>;
    calculateMoonPhase(date: Date): Promise<MoonPhase>;
    calculateNextMoonPhases(date: Date): Promise<NextMoonPhases>;
    getAyanamsa(date: Date, ayanamsaType?: number): number;
    dateToJulian(date: Date): number;
    setEphePath(_path: string): void;
    clearCaches(): void;
    setCaching(_enabled: boolean): void;
}
//# sourceMappingURL=instance.d.ts.map