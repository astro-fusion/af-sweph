/**
 * JsonEngine — implements ICalculationEngine using pre-generated CSV ephemeris data.
 *
 * Tier: JSON (sits between CACHE and FAST in the calculation hierarchy)
 * Zero native dependencies — works on Vercel serverless, edge, React Native.
 */

import type {
    ICalculationEngine,
    Planet,
    GeoLocation,
    LagnaInfo,
    SunTimes,
    MoonPhase,
    CalculationOptions,
    CalculationTier,
} from '@af/sweph-core';
import { EngineFeatures } from '@af/sweph-core';
import type { DailyPlanetaryRow } from './types';
import { EphemerisStore } from './loader';
import { getFastLagna } from './lagna';
import { getAyanamsa, AYANAMSA_TYPE } from './ayanamsa';
import { norm360 } from './interpolate';

// Planet definitions: id, name, CSV key prefix, display order
const VEDIC_PLANETS = [
    { id: '0',  name: 'Sun',     key: 'sun'     },
    { id: '1',  name: 'Moon',    key: 'moon'    },
    { id: '4',  name: 'Mars',    key: 'mars'    },
    { id: '2',  name: 'Mercury', key: 'mercury' },
    { id: '5',  name: 'Jupiter', key: 'jupiter' },
    { id: '3',  name: 'Venus',   key: 'venus'   },
    { id: '6',  name: 'Saturn',  key: 'saturn'  },
    { id: '10', name: 'Rahu',    key: 'rahu'    },
    { id: '11', name: 'Ketu',    key: 'ketu'    },
] as const;

type PlanetKey = typeof VEDIC_PLANETS[number]['key'];

function getLong(row: DailyPlanetaryRow, key: PlanetKey): number {
    return (row as unknown as Record<string, number>)[`${key}_long`] ?? 0;
}
function getSpeed(row: DailyPlanetaryRow, key: PlanetKey): number {
    return (row as unknown as Record<string, number>)[`${key}_speed`] ?? 0;
}

function toSidereal(tropLong: number, ayanamsa: number): number {
    return norm360(tropLong - ayanamsa);
}

function toPlanet(
    row: DailyPlanetaryRow,
    def: typeof VEDIC_PLANETS[number],
    ayanamsa: number
): Planet {
    const tropLong = getLong(row, def.key);
    const speed = getSpeed(row, def.key);
    const sidLong = toSidereal(tropLong, ayanamsa);
    const rasi = Math.floor(sidLong / 30) + 1;
    const rasiDegree = sidLong % 30;
    return {
        id: def.id,
        name: def.name,
        longitude: sidLong,
        totalDegree: sidLong,
        latitude: 0,
        distance: 0,
        speed,
        rasi,
        rasiDegree,
        isRetrograde: speed < 0,
    };
}

// ============================================================================
// Sun rise/set approximation (Sunrise Equation)
// ============================================================================

function sunriseSunset(
    date: Date,
    lat: number,
    lon: number,
    row: DailyPlanetaryRow,
): { sunrise: Date | null; sunset: Date | null; solarNoon: Date } {
    const DEG2RAD = Math.PI / 180;
    const RAD2DEG = 180 / Math.PI;

    const decl = row.sun_declination * DEG2RAD;
    const latRad = lat * DEG2RAD;

    // Hour angle at sunrise/sunset (zenith = 90.833°)
    const cosH =
        (Math.cos(90.833 * DEG2RAD) - Math.sin(latRad) * Math.sin(decl)) /
        (Math.cos(latRad) * Math.cos(decl));

    const y = date.getUTCFullYear();
    const mo = date.getUTCMonth();
    const d = date.getUTCDate();

    // Approximate equation of time in hours
    const eqtHours = row.equation_of_time / 60;
    const solarNoonUTC = 12 - lon / 15 - eqtHours;
    const solarNoon = new Date(Date.UTC(y, mo, d, 0, 0, 0, Math.round(solarNoonUTC * 3_600_000)));

    if (Math.abs(cosH) > 1) {
        // Polar day or polar night
        return { sunrise: null, sunset: null, solarNoon };
    }

    const H = Math.acos(cosH) * RAD2DEG;
    const sunriseUTC = solarNoonUTC - H / 15;
    const sunsetUTC = solarNoonUTC + H / 15;

    const sunrise = new Date(Date.UTC(y, mo, d, 0, 0, 0, Math.round(sunriseUTC * 3_600_000)));
    const sunset = new Date(Date.UTC(y, mo, d, 0, 0, 0, Math.round(sunsetUTC * 3_600_000)));
    const dayLength = (sunset.getTime() - sunrise.getTime()) / 3_600_000;

    return { sunrise, sunset, solarNoon };
}

// ============================================================================
// Moon phase
// ============================================================================

function moonPhase(row: DailyPlanetaryRow, ayanamsa: number): MoonPhase {
    // Sun–Moon elongation (sidereal)
    const sunSid = toSidereal(row.sun_long, ayanamsa);
    const moonSid = toSidereal(row.moon_long, ayanamsa);
    const phase = norm360(moonSid - sunSid);

    const illumination = (1 - Math.cos(phase * Math.PI / 180)) / 2;
    const age = phase / 360 * 29.53;

    let phaseName = 'New Moon';
    if (phase < 45) phaseName = 'New Moon';
    else if (phase < 90) phaseName = 'Waxing Crescent';
    else if (phase < 135) phaseName = 'First Quarter';
    else if (phase < 180) phaseName = 'Waxing Gibbous';
    else if (phase < 225) phaseName = 'Full Moon';
    else if (phase < 270) phaseName = 'Waning Gibbous';
    else if (phase < 315) phaseName = 'Last Quarter';
    else phaseName = 'Waning Crescent';

    return { phase, illumination, age, phaseName };
}

// ============================================================================
// JsonEngine
// ============================================================================

// JSON tier sits between CACHE (0) and FAST (1) — introduce as tier 0.5
// For interface compatibility we cast to the CalculationTier enum type.
const JSON_TIER = 1 as CalculationTier; // report as FAST tier

export class JsonEngine implements ICalculationEngine {
    readonly tier: CalculationTier = JSON_TIER;
    readonly name = 'JsonEngine';
    readonly supportedFeatures = new Set([
        EngineFeatures.PLANETS,
        EngineFeatures.LAGNA,
        EngineFeatures.SUN_TIMES,
        EngineFeatures.MOON_PHASE,
        EngineFeatures.AYANAMSA,
    ]);

    private readonly store: EphemerisStore;

    constructor(store: EphemerisStore) {
        this.store = store;
    }

    async isAvailable(): Promise<boolean> {
        return true;
    }

    async initialize(): Promise<void> {
        // Nothing to initialise — lazy loaded on first use
    }

    dispose(): void {
        // Nothing to dispose
    }

    async calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]> {
        const ayanamsaType = options?.ayanamsa ?? AYANAMSA_TYPE.LAHIRI;
        const row = await this.store.getInterpolated(date);
        if (!row) return [];

        // Use high-resolution moon data if available
        const moonData = await this.store.getMoonInterpolated(date);
        const ayanamsa = row.ayanamsa; // Use stored Lahiri value from data

        // For non-Lahiri ayanamsa, calculate via formula
        const activeAyanamsa =
            ayanamsaType === AYANAMSA_TYPE.LAHIRI
                ? ayanamsa
                : getAyanamsa(date, ayanamsaType);

        return VEDIC_PLANETS.map((def) => {
            const p = toPlanet(row, def, activeAyanamsa);
            // Override Moon with higher-resolution data
            if (def.key === 'moon' && moonData) {
                const sidLong = toSidereal(moonData.moon_long, activeAyanamsa);
                return {
                    ...p,
                    longitude: sidLong,
                    totalDegree: sidLong,
                    rasi: Math.floor(sidLong / 30) + 1,
                    rasiDegree: sidLong % 30,
                    speed: moonData.moon_speed,
                    isRetrograde: moonData.moon_speed < 0,
                };
            }
            return p;
        });
    }

    async calculateLagna(
        date: Date,
        location: GeoLocation,
        options?: CalculationOptions
    ): Promise<LagnaInfo> {
        const ayanamsaType = options?.ayanamsa ?? AYANAMSA_TYPE.LAHIRI;
        const result = getFastLagna(date, location.latitude, location.longitude, ayanamsaType);
        return {
            longitude: result.longitude,
            rasi: result.rasi,
            rasiDegree: result.rasiDegree,
            nakshatra: result.nakshatra,
        };
    }

    async calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes> {
        const row = await this.store.getInterpolated(date);
        if (!row) {
            const noon = new Date(date);
            noon.setUTCHours(12, 0, 0, 0);
            return { sunrise: null, sunset: null, solarNoon: noon, dayLength: 0 };
        }

        const { sunrise, sunset, solarNoon } = sunriseSunset(
            date, location.latitude, location.longitude, row
        );
        const dayLength = sunrise && sunset
            ? (sunset.getTime() - sunrise.getTime()) / 3_600_000
            : 0;

        return { sunrise, sunset, solarNoon, dayLength };
    }

    async calculateMoonPhase(date: Date): Promise<MoonPhase> {
        const row = await this.store.getInterpolated(date);
        if (!row) return { phase: 0, illumination: 0, age: 0, phaseName: 'Unknown' };
        return moonPhase(row, row.ayanamsa);
    }

    getAyanamsa(date: Date, type?: number): number {
        return getAyanamsa(date, type ?? AYANAMSA_TYPE.LAHIRI);
    }
}
