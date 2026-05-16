/**
 * @af/sweph-json — Type definitions
 *
 * Describes the schema produced by scripts/generate-ephemeris.js.
 * One row per day (or 6-hourly for Moon), columns: date + per-planet pairs.
 */

// ============================================================================
// Raw data format (CSV / parsed row)
// ============================================================================

/**
 * A single day's planetary snapshot as parsed from CSV.
 *
 * All longitude values are in ecliptic degrees [0, 360).
 * Speed values are degrees/day (negative = retrograde).
 * ayanamsa is the Lahiri ayanamsa value for that date.
 */
export interface DailyPlanetaryRow {
    /** ISO date string (YYYY-MM-DD) */
    date: string;
    /** Lahiri ayanamsa in degrees */
    ayanamsa: number;
    /** Sun declination in degrees */
    sun_declination: number;
    /** Equation of time in minutes */
    equation_of_time: number;

    // Tropical longitudes (ayanamsa must be subtracted for sidereal)
    sun_long: number;
    sun_speed: number;
    moon_long: number;
    moon_speed: number;
    mars_long: number;
    mars_speed: number;
    mercury_long: number;
    mercury_speed: number;
    jupiter_long: number;
    jupiter_speed: number;
    venus_long: number;
    venus_speed: number;
    saturn_long: number;
    saturn_speed: number;
    uranus_long: number;
    uranus_speed: number;
    neptune_long: number;
    neptune_speed: number;
    pluto_long: number;
    pluto_speed: number;
    rahu_long: number;
    rahu_speed: number;
    ketu_long: number;
    ketu_speed: number;
}

/**
 * Higher-resolution Moon row (6-hourly).
 * Has the same shape but a datetime string with time component.
 */
export interface MoonRow {
    /** ISO datetime string (YYYY-MM-DD HH:MM:SS or similar) */
    date: string;
    moon_long: number;
    moon_speed: number;
}

// ============================================================================
// In-memory cache structures
// ============================================================================

/** Keyed by "YYYY-MM-DD", value is the parsed row */
export type DailyCache = Map<string, DailyPlanetaryRow>;

/** Keyed by "YYYY-MM-DD", value is array of 4 intra-day snapshots */
export type MoonCache = Map<string, MoonRow[]>;

// ============================================================================
// Loader abstraction
// ============================================================================

/**
 * Fetches raw CSV text for a given year.
 * Implement this for your environment (Node FS, fetch, CDN, etc.).
 */
export interface IEphemerisLoader {
    loadYear(year: number): Promise<string>;
    loadMoonYear?(year: number): Promise<string>;
}

// ============================================================================
// Engine result types (mirrors @af/sweph-core for drop-in usage)
// ============================================================================

export interface JsonPlanet {
    id: string;
    name: string;
    /** Sidereal longitude in degrees [0, 360) */
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
    rasi: number;
    rasiDegree: number;
    isRetrograde: boolean;
    totalDegree: number;
    houseNumber?: number;
}

export interface JsonLagnaInfo {
    longitude: number;
    rasi: number;
    rasiDegree: number;
    nakshatra?: number;
    houses?: number[];
}

export interface JsonSunTimes {
    sunrise: Date | null;
    sunset: Date | null;
    solarNoon: Date;
    dayLength: number;
}

export interface JsonMoonPhase {
    phase: number;
    illumination: number;
    age: number;
    phaseName: string;
}

// ============================================================================
// createJsonSweph options
// ============================================================================

export interface JsonSwephOptions {
    /** Custom data loader. If omitted, a default no-op stub is used. */
    loader?: IEphemerisLoader;
    /**
     * Pre-loaded data cache keyed by year.
     * Use this when you bundle the JSON data directly (e.g. via import()).
     * Values must be raw CSV strings — they will be parsed on first use.
     */
    preloadedData?: Record<number, string>;
    /**
     * Pre-loaded Moon data cache keyed by year (optional, improves Moon accuracy).
     */
    preloadedMoonData?: Record<number, string>;
}
