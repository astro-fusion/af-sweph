/**
 * @af/sweph-core - Shared Types and Interfaces
 * 
 * Platform-agnostic type definitions for Swiss Ephemeris calculations.
 * Used by @af/sweph, @af/sweph-wasm, and @af/sweph-react-native.
 */

// ============================================================================
// Core Calculation Types
// ============================================================================

/**
 * Result of swe_calc_ut calculation
 */
export interface CalcResult {
    longitude: number;
    latitude: number;
    distance: number;
    longitudeSpeed: number;
    latitudeSpeed: number;
    distanceSpeed: number;
    error?: string;
}

/**
 * Result of swe_rise_trans calculation
 */
export interface RiseTransResult {
    transitTime: number;
    flag: number;
    error?: string;
}

/**
 * Result of swe_azalt calculation
 */
export interface AzAltResult {
    azimuth: number;
    altitude: number;
    error?: string;
}

/**
 * Result of swe_houses calculation
 */
export interface HouseResult {
    /** 13 doubles: cusp 1-12 (index 1-12), index 0 is always 0 */
    cusp: number[];
    /** 8 doubles: ascmc: 0=Asc, 1=MC, 2=ARMC, 3=Vertex, etc */
    ascmc: number[];
    error?: string;
}

// ============================================================================
// High-Level Domain Types
// ============================================================================

/**
 * Geographic location for astronomical calculations
 */
export interface GeoLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    timezone?: number;
}

/**
 * Calculated planetary position
 */
export interface Planet {
    id: string;
    name: string;
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
    rasi: number;
    rasiDegree: number;
    houseNumber?: number;
    isRetrograde: boolean;
    totalDegree?: number;
    azimuth?: number;
    altitude?: number;
    isCombust?: boolean;
}

/**
 * Options for planet calculations
 */
export interface CalculationOptions {
    location?: GeoLocation;
    ayanamsa?: number;
    houseSystem?: string;
    includeOuterPlanets?: boolean;
}

/**
 * Sun times calculation result
 */
export interface SunTimes {
    sunrise: Date | null;
    sunset: Date | null;
    solarNoon: Date;
    dayLength: number;
    civilTwilightStart?: Date | null;
    civilTwilightEnd?: Date | null;
    nauticalTwilightStart?: Date | null;
    nauticalTwilightEnd?: Date | null;
    astronomicalTwilightStart?: Date | null;
    astronomicalTwilightEnd?: Date | null;
}

/**
 * Moon data calculation result
 */
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

/**
 * Moon phase information
 */
export interface MoonPhase {
    phase: number;
    illumination: number;
    age: number;
    phaseName: string;
}

/**
 * Planet rise/set times
 */
export interface PlanetRiseSetTimes {
    rise: Date | null;
    set: Date | null;
    transit: Date | null;
    transitAltitude: number;
    transitDistance: number;
}

// ============================================================================
// Platform Adapter Interface
// ============================================================================

/**
 * Low-level Swiss Ephemeris adapter interface
 * Each platform (Node, WASM, React Native) implements this interface
 */
export interface ISwephAdapter {
    // Julian day calculations
    swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number;

    // Planetary calculations
    swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): CalcResult | { error: string };

    // Ephemeris path
    swe_set_ephe_path(path: string): void;

    // Sidereal mode
    swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void;
    swe_get_ayanamsa(tjd_et: number): number;
    swe_get_ayanamsa_ut(tjd_ut: number): number;

    // Rise/set calculations
    swe_rise_trans(
        tjd_ut: number,
        ipl: number,
        starname: string,
        epheflag: number,
        rsmi: number,
        geopos: number[],
        atpress: number,
        attemp: number
    ): RiseTransResult | { error: string };

    // Azimuth/altitude
    swe_azalt(
        tjd_ut: number,
        calc_flag: number,
        geopos: number[],
        atpress: number,
        attemp: number,
        xin: number[]
    ): AzAltResult;

    // specific house calculation
    swe_houses(
        tjd_ut: number,
        geolat: number,
        geolon: number,
        hsys: number
    ): HouseResult | { error: string };

    // Version info
    swe_version?(): string;

    // Constants (optional, may be on module itself)
    SEFLG_SWIEPH?: number;
    SEFLG_SPEED?: number;
    SE_CALC_RISE?: number;
    SE_CALC_SET?: number;
    SE_CALC_MTRANSIT?: number;
}

/**
 * High-level unified Swiss Ephemeris instance
 * Provides the same API across all platforms
 */
export interface ISwephInstance {
    /** The underlying platform adapter */
    readonly adapter: ISwephAdapter;

    /** Current platform identifier */
    readonly platform: 'node' | 'browser' | 'react-native';

    // High-level calculation methods
    calculatePlanets(date: Date, options?: CalculationOptions): Planet[];
    calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): LagnaInfo;
    calculateSunTimes(date: Date, location: GeoLocation): SunTimes;
    calculateMoonData(date: Date, location: GeoLocation): MoonData;
    calculateMoonPhase(date: Date): MoonPhase;
    calculatePlanetRiseSetTimes(planetId: number, date: Date, location: GeoLocation): PlanetRiseSetTimes;

    // Utility methods
    getAyanamsa(date: Date, ayanamsaType?: number): number;
    dateToJulian(date: Date): number;
    julianToDate(jd: number, timezoneOffset?: number): Date;
}

// ============================================================================
// Enums and Planet IDs
// ============================================================================

/**
 * Swiss Ephemeris planet identifiers
 */
export enum PlanetId {
    SUN = 0,
    MOON = 1,
    MERCURY = 2,
    VENUS = 3,
    MARS = 4,
    JUPITER = 5,
    SATURN = 6,
    URANUS = 7,
    NEPTUNE = 8,
    PLUTO = 9,
    MEAN_NODE = 10,    // Rahu (Mean)
    TRUE_NODE = 11,    // Rahu (True)
    MEAN_APOGEE = 12,  // Lilith
    OSCU_APOGEE = 13,
    EARTH = 14,
    CHIRON = 15,
}

/**
 * Ayanamsa types for sidereal calculations
 */
export enum AyanamsaType {
    FAGAN_BRADLEY = 0,
    LAHIRI = 1,
    DELUCE = 2,
    RAMAN = 3,
    USHASHASHI = 4,
    KRISHNAMURTI = 5,
    DJWHAL_KHUL = 6,
    YUKTESHWAR = 7,
    JN_BHASIN = 8,
    BABYL_KUGLER1 = 9,
    BABYL_KUGLER2 = 10,
    BABYL_KUGLER3 = 11,
    BABYL_HUBER = 12,
    BABYL_ETPSC = 13,
    ALDEBARAN_15TAU = 14,
    HIPPARCHOS = 15,
    SASSANIAN = 16,
    GALCENT_0SAG = 17,
    J2000 = 18,
    J1900 = 19,
    B1950 = 20,
}

/**
 * House system identifiers
 */
export enum HouseSystem {
    PLACIDUS = 'P',
    KOCH = 'K',
    PORPHYRIUS = 'O',
    REGIOMONTANUS = 'R',
    CAMPANUS = 'C',
    EQUAL = 'E',
    WHOLE_SIGN = 'W',
    MERIDIAN = 'X',
    ALCABITIUS = 'B',
    MORINUS = 'M',
    KRUSINSKI = 'U',
    SRIPATI = 'S',
}

// ============================================================================
// Tiered Calculation System
// ============================================================================

/**
 * Calculation engine tiers (lowest = fastest, highest = most accurate)
 * 
 * The system defaults to the FAST tier and only escalates when:
 * 1. A feature is not supported (e.g., House Systems in Lite engine)
 * 2. The user explicitly requests a higher tier
 */
export enum CalculationTier {
    /** In-memory cache hit - instant response */
    CACHE = 0,
    /** Pure JS (astronomy-engine) - ~50ms, good for planets/sun/moon */
    FAST = 1,
    /** WebAssembly SWEPH - ~100ms, supports house systems */
    WASM = 2,
    /** Native C++ SWEPH - ~200ms, sub-arcsecond accuracy */
    NATIVE = 3,
}

/**
 * Metadata about how a calculation was performed
 */
export interface TierMetadata {
    /** Which tier was used for this calculation */
    tier: CalculationTier;
    /** Human-readable tier name */
    tierName: 'cache' | 'lite' | 'wasm' | 'native';
    /** Accuracy classification */
    accuracy: 'approximate' | 'high' | 'exact';
    /** Time taken for the calculation in milliseconds */
    latencyMs: number;
    /** Whether this result came from cache */
    cached: boolean;
    /** If escalation occurred, the reason */
    escalationReason?: string;
}

/**
 * Extended calculation result with tier information
 */
export interface TieredResult<T> {
    /** The calculation result data */
    data: T;
    /** Metadata about the calculation */
    meta: TierMetadata;
}

/**
 * Options for tiered calculations
 */
export interface TieredCalculationOptions extends CalculationOptions {
    /** Minimum acceptable tier (default: FAST) */
    minTier?: CalculationTier;
    /** Maximum tier to attempt (default: NATIVE) */
    maxTier?: CalculationTier;
    /** Force specific tier (bypasses auto-selection) */
    forceTier?: CalculationTier;
    /** Enable streaming updates - callback receives progressively accurate results */
    streaming?: boolean;
}

/**
 * Error thrown when a feature is not supported by an engine
 */
export class FeatureNotSupportedError extends Error {
    constructor(
        public readonly feature: string,
        public readonly tier: CalculationTier
    ) {
        super(`Feature '${feature}' is not supported by tier ${CalculationTier[tier]}`);
        this.name = 'FeatureNotSupportedError';
    }
}

/**
 * Lagna (Ascendant) information
 */
export interface LagnaInfo {
    /** Longitude of the ascendant in degrees */
    longitude: number;
    /** Rashi (sign) number 1-12 */
    rasi: number;
    /** Degree within the rashi */
    rasiDegree: number;
    /** Nakshatra number 1-27 */
    nakshatra?: number;
    /** House cusps (12 values) */
    houses?: number[];
}

/**
 * Abstract interface for all calculation engines.
 * Implemented by: LiteEngine, WasmEngine, NativeEngine
 * 
 * Each engine declares which features it supports. The router
 * automatically escalates to a higher tier when a feature is missing.
 */
export interface ICalculationEngine {
    /** Which tier this engine represents */
    readonly tier: CalculationTier;
    
    /** Human-readable engine name */
    readonly name: string;
    
    /** List of supported features */
    readonly supportedFeatures: Set<string>;

    /** Check if this engine is available in current environment */
    isAvailable(): Promise<boolean>;

    /** Initialize the engine (load WASM, native module, etc.) */
    initialize(): Promise<void>;

    /** Dispose of resources */
    dispose(): void;

    // =========================================================================
    // Core Calculation Methods
    // =========================================================================

    /**
     * Calculate positions for all Vedic planets
     * Supported by: FAST, WASM, NATIVE
     */
    calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]>;

    /**
     * Calculate Lagna (Ascendant) and house cusps
     * Supported by: WASM, NATIVE (NOT supported by FAST/Lite)
     */
    calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): Promise<LagnaInfo>;

    /**
     * Calculate sun times (sunrise, sunset, solar noon)
     * Supported by: FAST, WASM, NATIVE
     */
    calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes>;

    /**
     * Calculate moon phase
     * Supported by: FAST, WASM, NATIVE
     */
    calculateMoonPhase(date: Date): Promise<MoonPhase>;

    /**
     * Get ayanamsa value for sidereal calculations
     * Supported by: FAST (approximated), WASM, NATIVE
     */
    getAyanamsa(date: Date, type?: number): number;
}

/**
 * Feature identifiers for capability checking
 */
export const EngineFeatures = {
    PLANETS: 'planets',
    LAGNA: 'lagna',
    HOUSES: 'houses',
    SUN_TIMES: 'sun_times',
    MOON_PHASE: 'moon_phase',
    MOON_TIMES: 'moon_times',
    PLANET_RISE_SET: 'planet_rise_set',
    AYANAMSA: 'ayanamsa',
    AYANAMSA_EXACT: 'ayanamsa_exact',
} as const;

export type EngineFeature = typeof EngineFeatures[keyof typeof EngineFeatures];
