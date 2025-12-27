/**
 * Type Definitions for @AstroFusion/sweph
 *
 * All TypeScript types used across the library.
 */
/**
 * Geographic location with optional timezone
 */
export interface GeoLocation {
    /** Latitude in decimal degrees (-90 to 90) */
    latitude: number;
    /** Longitude in decimal degrees (-180 to 180) */
    longitude: number;
    /** Timezone offset in hours from UTC (e.g., 5.75 for Nepal) */
    timezone?: number;
}
/**
 * Planet position with all astronomical details
 */
export interface Planet {
    /** Unique identifier for the planet */
    id: string;
    /** Planet name (Sun, Moon, Mars, etc.) */
    name: string;
    /** Ecliptic longitude in degrees (0-360) */
    longitude: number;
    /** Ecliptic latitude in degrees */
    latitude: number;
    /** Distance from Earth in AU */
    distance: number;
    /** Daily motion in degrees (negative = retrograde) */
    speed: number;
    /** Rashi (zodiac sign) number (1-12) */
    rasi: number;
    /** Degree within the rashi (0-30) */
    rasiDegree: number;
    /** House number (1-12), if calculated with location */
    houseNumber?: number;
    /** Whether planet is retrograde */
    isRetrograde: boolean;
    /** Legacy alias for longitude */
    totalDegree?: number;
    /** Azimuth in degrees (Horizontal coordinate) */
    azimuth?: number;
    /** Altitude in degrees (Horizontal coordinate) */
    altitude?: number;
    /** Whether planet is combust (too close to Sun) */
    isCombust?: boolean;
}
/**
 * Lagna (Ascendant) and house cusp information
 */
export interface LagnaInfo {
    /** Ascendant longitude in degrees (0-360) */
    longitude: number;
    /** Ascendant rashi (1-12) */
    rasi: number;
    /** Degree within the rashi (0-30) */
    degree: number;
    /** Array of 12 house cusp longitudes */
    houses: number[];
    /** Ayanamsa value used in calculation */
    ayanamsaValue: number;
    /** Legacy alias for longitude */
    lagna?: number;
    /** Legacy alias for rasi */
    lagnaRasi?: number;
    /** Legacy alias for degree */
    lagnaDegree?: number;
    /** Julian Day of calculation */
    julianDay?: number;
}
/**
 * Sun times and related data
 */
export interface SunTimes {
    /** Sunrise time */
    sunrise: Date;
    /** Sunset time */
    sunset: Date;
    /** Solar noon (sun at highest point) */
    solarNoon: Date;
    /** Day length in hours */
    dayLength: number;
    /** Civil twilight start (sun 6° below horizon) */
    civilTwilightStart: Date | null;
    /** Civil twilight end */
    civilTwilightEnd: Date | null;
    /** Nautical twilight start (sun 12° below horizon) */
    nauticalTwilightStart: Date | null;
    /** Nautical twilight end */
    nauticalTwilightEnd: Date | null;
    /** Astronomical twilight start (sun 18° below horizon) */
    astronomicalTwilightStart?: Date | null;
    /** Astronomical twilight end */
    astronomicalTwilightEnd?: Date | null;
}
/**
 * Moon data including rise/set and phase
 */
export interface MoonData {
    /** Moonrise time (null if doesn't rise that day) */
    moonrise: Date | null;
    /** Moonset time (null if doesn't set that day) */
    moonset: Date | null;
    /** Meridian transit time (moon's highest point) */
    transit?: Date | null;
    /** Moon phase angle (0-360, 0=new, 180=full) */
    phase: number;
    /** Illumination percentage (0-100) */
    illumination: number;
    /** Moon age in days (0-29.5) */
    age: number;
    /** Phase name (New Moon, Waxing Crescent, etc.) */
    phaseName: string;
    /** Distance from Earth in km */
    distance?: number;
}
/**
 * Upcoming moon phases
 */
export interface NextMoonPhases {
    /** Next new moon date */
    newMoon: Date;
    /** Next first quarter date */
    firstQuarter: Date;
    /** Next full moon date */
    fullMoon: Date;
    /** Next last quarter date */
    lastQuarter: Date;
}
/**
 * Solar noon result
 */
export interface SolarNoonResult {
    /** Solar noon time */
    time: Date;
    /** Sun altitude at noon in degrees */
    altitude: number;
}
/**
 * Rise and set times for any celestial body
 */
export interface RiseSetTimes {
    /** Rise time (null if doesn't rise) */
    rise: Date | null;
    /** Set time (null if doesn't set) */
    set: Date | null;
}
/**
 * Celestial body position in horizontal coordinates
 */
export interface CelestialPosition {
    /** Azimuth in degrees (0=North, 90=East) */
    azimuth: number;
    /** Altitude in degrees above horizon */
    altitude: number;
    /** Distance in AU */
    distance: number;
}
/**
 * Calculation options
 */
export interface CalculationOptions {
    /** Ayanamsa system (default: Lahiri = 1) */
    ayanamsa?: number;
    /** House system (default: Placidus = 'P') */
    houseSystem?: string;
    /** Include speed/retrograde calculations */
    includeSpeed?: boolean;
    /** Include outer planets (Uranus, Neptune, Pluto) */
    includeOuterPlanets?: boolean;
    /** Geographic location for topocentric/horizontal calculations */
    location?: GeoLocation;
}
/**
 * Planet identifiers used in Swiss Ephemeris
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
    MEAN_NODE = 10,// Rahu (mean)
    TRUE_NODE = 11,// Rahu (true)
    MEAN_APOGEE = 12,// Lilith
    CHIRON = 15
}
/**
 * Ayanamsa systems
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
    BABYLONIAN_KUGLER1 = 9,
    BABYLONIAN_KUGLER2 = 10,
    BABYLONIAN_KUGLER3 = 11,
    BABYLONIAN_HUBER = 12,
    BABYLONIAN_ETPSC = 13,
    ALDEBARAN_15TAU = 14,
    HIPPARCHOS = 15,
    SASSANIAN = 16,
    GALCENT_0SAG = 17,
    J2000 = 18,
    J1900 = 19,
    B1950 = 20,
    TRUE_CITRA = 27,
    TRUE_REVATI = 28,
    TRUE_PUSHYA = 29
}
/**
 * House calculation systems
 */
export declare enum HouseSystem {
    PLACIDUS = "P",
    KOCH = "K",
    REGIOMONTANUS = "R",
    CAMPANUS = "C",
    EQUAL = "E",
    VEHLOW_EQUAL = "V",
    WHOLE_SIGN = "W",
    MERIDIAN = "X",
    HORIZON = "H",
    POLICH_PAGE = "T",
    ALCABITIUS = "B",
    MORINUS = "M",
    PORPHYRIUS = "O",
    SRIPATI = "S"
}
//# sourceMappingURL=types.d.ts.map