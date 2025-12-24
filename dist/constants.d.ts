/**
 * Constants for @AstroFusion/sweph
 */
import { PlanetId, AyanamsaType, HouseSystem } from './types';
/**
 * Planet definitions for Vedic astrology (9 grahas)
 */
export declare const PLANETS: {
    readonly SUN: {
        readonly id: PlanetId.SUN;
        readonly name: "Sun";
        readonly sanskrit: "Surya";
    };
    readonly MOON: {
        readonly id: PlanetId.MOON;
        readonly name: "Moon";
        readonly sanskrit: "Chandra";
    };
    readonly MARS: {
        readonly id: PlanetId.MARS;
        readonly name: "Mars";
        readonly sanskrit: "Mangal";
    };
    readonly MERCURY: {
        readonly id: PlanetId.MERCURY;
        readonly name: "Mercury";
        readonly sanskrit: "Budha";
    };
    readonly JUPITER: {
        readonly id: PlanetId.JUPITER;
        readonly name: "Jupiter";
        readonly sanskrit: "Guru";
    };
    readonly VENUS: {
        readonly id: PlanetId.VENUS;
        readonly name: "Venus";
        readonly sanskrit: "Shukra";
    };
    readonly SATURN: {
        readonly id: PlanetId.SATURN;
        readonly name: "Saturn";
        readonly sanskrit: "Shani";
    };
    readonly RAHU: {
        readonly id: PlanetId.TRUE_NODE;
        readonly name: "Rahu";
        readonly sanskrit: "Rahu";
    };
    readonly KETU: {
        readonly id: -1;
        readonly name: "Ketu";
        readonly sanskrit: "Ketu";
    };
};
/**
 * Vedic planet order (traditional order)
 */
export declare const VEDIC_PLANET_ORDER: readonly [{
    readonly id: PlanetId.SUN;
    readonly name: "Sun";
    readonly sanskrit: "Surya";
}, {
    readonly id: PlanetId.MOON;
    readonly name: "Moon";
    readonly sanskrit: "Chandra";
}, {
    readonly id: PlanetId.MARS;
    readonly name: "Mars";
    readonly sanskrit: "Mangal";
}, {
    readonly id: PlanetId.MERCURY;
    readonly name: "Mercury";
    readonly sanskrit: "Budha";
}, {
    readonly id: PlanetId.JUPITER;
    readonly name: "Jupiter";
    readonly sanskrit: "Guru";
}, {
    readonly id: PlanetId.VENUS;
    readonly name: "Venus";
    readonly sanskrit: "Shukra";
}, {
    readonly id: PlanetId.SATURN;
    readonly name: "Saturn";
    readonly sanskrit: "Shani";
}, {
    readonly id: PlanetId.TRUE_NODE;
    readonly name: "Rahu";
    readonly sanskrit: "Rahu";
}, {
    readonly id: -1;
    readonly name: "Ketu";
    readonly sanskrit: "Ketu";
}];
/**
 * Rashi (zodiac sign) names
 */
export declare const RASHIS: readonly [{
    readonly number: 1;
    readonly name: "Aries";
    readonly sanskrit: "Mesha";
}, {
    readonly number: 2;
    readonly name: "Taurus";
    readonly sanskrit: "Vrishabha";
}, {
    readonly number: 3;
    readonly name: "Gemini";
    readonly sanskrit: "Mithuna";
}, {
    readonly number: 4;
    readonly name: "Cancer";
    readonly sanskrit: "Karka";
}, {
    readonly number: 5;
    readonly name: "Leo";
    readonly sanskrit: "Simha";
}, {
    readonly number: 6;
    readonly name: "Virgo";
    readonly sanskrit: "Kanya";
}, {
    readonly number: 7;
    readonly name: "Libra";
    readonly sanskrit: "Tula";
}, {
    readonly number: 8;
    readonly name: "Scorpio";
    readonly sanskrit: "Vrishchika";
}, {
    readonly number: 9;
    readonly name: "Sagittarius";
    readonly sanskrit: "Dhanu";
}, {
    readonly number: 10;
    readonly name: "Capricorn";
    readonly sanskrit: "Makara";
}, {
    readonly number: 11;
    readonly name: "Aquarius";
    readonly sanskrit: "Kumbha";
}, {
    readonly number: 12;
    readonly name: "Pisces";
    readonly sanskrit: "Meena";
}];
/**
 * Ayanamsa systems - re-export for convenience
 */
export declare const AYANAMSA: typeof AyanamsaType;
/**
 * House systems - re-export for convenience
 */
export declare const HOUSE_SYSTEMS: typeof HouseSystem;
/**
 * Default calculation flags for Swiss Ephemeris
 */
export declare const CALC_FLAGS: {
    readonly SIDEREAL: 65536;
    readonly SPEED: 256;
    readonly SWIEPH: 2;
    readonly EQUATORIAL: 2048;
    readonly XYZ: 512;
    readonly TOPOCENTRIC: 8192;
};
/**
 * Moon phase names
 */
export declare const MOON_PHASES: readonly ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
/**
 * Nakshatra (lunar mansion) data
 */
export declare const NAKSHATRAS: readonly [{
    readonly number: 1;
    readonly name: "Ashwini";
    readonly lord: {
        readonly id: -1;
        readonly name: "Ketu";
        readonly sanskrit: "Ketu";
    };
}, {
    readonly number: 2;
    readonly name: "Bharani";
    readonly lord: {
        readonly id: PlanetId.VENUS;
        readonly name: "Venus";
        readonly sanskrit: "Shukra";
    };
}, {
    readonly number: 3;
    readonly name: "Krittika";
    readonly lord: {
        readonly id: PlanetId.SUN;
        readonly name: "Sun";
        readonly sanskrit: "Surya";
    };
}, {
    readonly number: 4;
    readonly name: "Rohini";
    readonly lord: {
        readonly id: PlanetId.MOON;
        readonly name: "Moon";
        readonly sanskrit: "Chandra";
    };
}, {
    readonly number: 5;
    readonly name: "Mrigashira";
    readonly lord: {
        readonly id: PlanetId.MARS;
        readonly name: "Mars";
        readonly sanskrit: "Mangal";
    };
}, {
    readonly number: 6;
    readonly name: "Ardra";
    readonly lord: {
        readonly id: PlanetId.TRUE_NODE;
        readonly name: "Rahu";
        readonly sanskrit: "Rahu";
    };
}, {
    readonly number: 7;
    readonly name: "Punarvasu";
    readonly lord: {
        readonly id: PlanetId.JUPITER;
        readonly name: "Jupiter";
        readonly sanskrit: "Guru";
    };
}, {
    readonly number: 8;
    readonly name: "Pushya";
    readonly lord: {
        readonly id: PlanetId.SATURN;
        readonly name: "Saturn";
        readonly sanskrit: "Shani";
    };
}, {
    readonly number: 9;
    readonly name: "Ashlesha";
    readonly lord: {
        readonly id: PlanetId.MERCURY;
        readonly name: "Mercury";
        readonly sanskrit: "Budha";
    };
}, {
    readonly number: 10;
    readonly name: "Magha";
    readonly lord: {
        readonly id: -1;
        readonly name: "Ketu";
        readonly sanskrit: "Ketu";
    };
}, {
    readonly number: 11;
    readonly name: "Purva Phalguni";
    readonly lord: {
        readonly id: PlanetId.VENUS;
        readonly name: "Venus";
        readonly sanskrit: "Shukra";
    };
}, {
    readonly number: 12;
    readonly name: "Uttara Phalguni";
    readonly lord: {
        readonly id: PlanetId.SUN;
        readonly name: "Sun";
        readonly sanskrit: "Surya";
    };
}, {
    readonly number: 13;
    readonly name: "Hasta";
    readonly lord: {
        readonly id: PlanetId.MOON;
        readonly name: "Moon";
        readonly sanskrit: "Chandra";
    };
}, {
    readonly number: 14;
    readonly name: "Chitra";
    readonly lord: {
        readonly id: PlanetId.MARS;
        readonly name: "Mars";
        readonly sanskrit: "Mangal";
    };
}, {
    readonly number: 15;
    readonly name: "Swati";
    readonly lord: {
        readonly id: PlanetId.TRUE_NODE;
        readonly name: "Rahu";
        readonly sanskrit: "Rahu";
    };
}, {
    readonly number: 16;
    readonly name: "Vishakha";
    readonly lord: {
        readonly id: PlanetId.JUPITER;
        readonly name: "Jupiter";
        readonly sanskrit: "Guru";
    };
}, {
    readonly number: 17;
    readonly name: "Anuradha";
    readonly lord: {
        readonly id: PlanetId.SATURN;
        readonly name: "Saturn";
        readonly sanskrit: "Shani";
    };
}, {
    readonly number: 18;
    readonly name: "Jyeshtha";
    readonly lord: {
        readonly id: PlanetId.MERCURY;
        readonly name: "Mercury";
        readonly sanskrit: "Budha";
    };
}, {
    readonly number: 19;
    readonly name: "Mula";
    readonly lord: {
        readonly id: -1;
        readonly name: "Ketu";
        readonly sanskrit: "Ketu";
    };
}, {
    readonly number: 20;
    readonly name: "Purva Ashadha";
    readonly lord: {
        readonly id: PlanetId.VENUS;
        readonly name: "Venus";
        readonly sanskrit: "Shukra";
    };
}, {
    readonly number: 21;
    readonly name: "Uttara Ashadha";
    readonly lord: {
        readonly id: PlanetId.SUN;
        readonly name: "Sun";
        readonly sanskrit: "Surya";
    };
}, {
    readonly number: 22;
    readonly name: "Shravana";
    readonly lord: {
        readonly id: PlanetId.MOON;
        readonly name: "Moon";
        readonly sanskrit: "Chandra";
    };
}, {
    readonly number: 23;
    readonly name: "Dhanishta";
    readonly lord: {
        readonly id: PlanetId.MARS;
        readonly name: "Mars";
        readonly sanskrit: "Mangal";
    };
}, {
    readonly number: 24;
    readonly name: "Shatabhisha";
    readonly lord: {
        readonly id: PlanetId.TRUE_NODE;
        readonly name: "Rahu";
        readonly sanskrit: "Rahu";
    };
}, {
    readonly number: 25;
    readonly name: "Purva Bhadrapada";
    readonly lord: {
        readonly id: PlanetId.JUPITER;
        readonly name: "Jupiter";
        readonly sanskrit: "Guru";
    };
}, {
    readonly number: 26;
    readonly name: "Uttara Bhadrapada";
    readonly lord: {
        readonly id: PlanetId.SATURN;
        readonly name: "Saturn";
        readonly sanskrit: "Shani";
    };
}, {
    readonly number: 27;
    readonly name: "Revati";
    readonly lord: {
        readonly id: PlanetId.MERCURY;
        readonly name: "Mercury";
        readonly sanskrit: "Budha";
    };
}];
/**
 * Julian Day for Unix Epoch (1970-01-01)
 */
export declare const JULIAN_UNIX_EPOCH = 2440587.5;
/**
 * Average length of a lunar month in days
 */
export declare const LUNAR_MONTH_DAYS = 29.530588853;
/**
 * Default average Earth-Moon distance in kilometers
 */
export declare const DEFAULT_MOON_DISTANCE_KM = 384400;
/**
 * Astronomical Unit in kilometers (1 AU = 149,597,870.7 km)
 */
export declare const AU_IN_KM = 149597870.7;
//# sourceMappingURL=constants.d.ts.map