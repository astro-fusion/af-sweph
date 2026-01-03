/**
 * @af/sweph-core - Shared Types and Interfaces
 *
 * Platform-agnostic type definitions for Swiss Ephemeris calculations.
 * Used by @af/sweph, @af/sweph-wasm, and @af/sweph-react-native.
 */
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
/**
 * Low-level Swiss Ephemeris adapter interface
 * Each platform (Node, WASM, React Native) implements this interface
 */
export interface ISwephAdapter {
    swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number;
    swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): CalcResult | {
        error: string;
    };
    swe_set_ephe_path(path: string): void;
    swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void;
    swe_get_ayanamsa(tjd_et: number): number;
    swe_get_ayanamsa_ut(tjd_ut: number): number;
    swe_rise_trans(tjd_ut: number, ipl: number, starname: string, epheflag: number, rsmi: number, geopos: number[], atpress: number, attemp: number): RiseTransResult | {
        error: string;
    };
    swe_azalt(tjd_ut: number, calc_flag: number, geopos: number[], atpress: number, attemp: number, xin: number[]): AzAltResult;
    swe_version?(): string;
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
    calculatePlanets(date: Date, options?: CalculationOptions): Planet[];
    calculateSunTimes(date: Date, location: GeoLocation): SunTimes;
    calculateMoonData(date: Date, location: GeoLocation): MoonData;
    calculateMoonPhase(date: Date): MoonPhase;
    calculatePlanetRiseSetTimes(planetId: number, date: Date, location: GeoLocation): PlanetRiseSetTimes;
    getAyanamsa(date: Date, ayanamsaType?: number): number;
    dateToJulian(date: Date): number;
    julianToDate(jd: number, timezoneOffset?: number): Date;
}
/**
 * Swiss Ephemeris planet identifiers
 */
export declare enum PlanetId {
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
    MEAN_NODE = 10,// Rahu (Mean)
    TRUE_NODE = 11,// Rahu (True)
    MEAN_APOGEE = 12,// Lilith
    OSCU_APOGEE = 13,
    EARTH = 14,
    CHIRON = 15
}
/**
 * Ayanamsa types for sidereal calculations
 */
export declare enum AyanamsaType {
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
    B1950 = 20
}
/**
 * House system identifiers
 */
export declare enum HouseSystem {
    PLACIDUS = "P",
    KOCH = "K",
    PORPHYRIUS = "O",
    REGIOMONTANUS = "R",
    CAMPANUS = "C",
    EQUAL = "E",
    WHOLE_SIGN = "W",
    MERIDIAN = "X",
    ALCABITIUS = "B",
    MORINUS = "M",
    KRUSINSKI = "U",
    SRIPATI = "S"
}
//# sourceMappingURL=types.d.ts.map