"use strict";
/**
 * Constants for @AstroFusion/sweph
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AU_IN_KM = exports.DEFAULT_MOON_DISTANCE_KM = exports.LUNAR_MONTH_DAYS = exports.JULIAN_UNIX_EPOCH = exports.NAKSHATRAS = exports.MOON_PHASES = exports.CALC_FLAGS = exports.HOUSE_SYSTEMS = exports.AYANAMSA = exports.RASHIS = exports.OUTER_PLANETS = exports.VEDIC_PLANET_ORDER = exports.PLANETS = void 0;
const types_1 = require("./types");
/**
 * Planet definitions for Vedic astrology (9 grahas)
 */
exports.PLANETS = {
    SUN: { id: types_1.PlanetId.SUN, name: 'Sun', sanskrit: 'Surya' },
    MOON: { id: types_1.PlanetId.MOON, name: 'Moon', sanskrit: 'Chandra' },
    MARS: { id: types_1.PlanetId.MARS, name: 'Mars', sanskrit: 'Mangal' },
    MERCURY: { id: types_1.PlanetId.MERCURY, name: 'Mercury', sanskrit: 'Budha' },
    JUPITER: { id: types_1.PlanetId.JUPITER, name: 'Jupiter', sanskrit: 'Guru' },
    VENUS: { id: types_1.PlanetId.VENUS, name: 'Venus', sanskrit: 'Shukra' },
    SATURN: { id: types_1.PlanetId.SATURN, name: 'Saturn', sanskrit: 'Shani' },
    RAHU: { id: types_1.PlanetId.TRUE_NODE, name: 'Rahu', sanskrit: 'Rahu' },
    KETU: { id: -1, name: 'Ketu', sanskrit: 'Ketu' }, // Calculated as 180° from Rahu
};
/**
 * Vedic planet order (traditional order)
 */
exports.VEDIC_PLANET_ORDER = [
    exports.PLANETS.SUN,
    exports.PLANETS.MOON,
    exports.PLANETS.MARS,
    exports.PLANETS.MERCURY,
    exports.PLANETS.JUPITER,
    exports.PLANETS.VENUS,
    exports.PLANETS.SATURN,
    exports.PLANETS.RAHU,
    exports.PLANETS.KETU,
];
/**
 * Outer planets (Western astrology)
 */
exports.OUTER_PLANETS = [
    { id: types_1.PlanetId.URANUS, name: 'Uranus', sanskrit: 'Arun' },
    { id: types_1.PlanetId.NEPTUNE, name: 'Neptune', sanskrit: 'Varun' },
    { id: types_1.PlanetId.PLUTO, name: 'Pluto', sanskrit: 'Yama' },
];
/**
 * Rashi (zodiac sign) names
 */
exports.RASHIS = [
    { number: 1, name: 'Aries', sanskrit: 'Mesha' },
    { number: 2, name: 'Taurus', sanskrit: 'Vrishabha' },
    { number: 3, name: 'Gemini', sanskrit: 'Mithuna' },
    { number: 4, name: 'Cancer', sanskrit: 'Karka' },
    { number: 5, name: 'Leo', sanskrit: 'Simha' },
    { number: 6, name: 'Virgo', sanskrit: 'Kanya' },
    { number: 7, name: 'Libra', sanskrit: 'Tula' },
    { number: 8, name: 'Scorpio', sanskrit: 'Vrishchika' },
    { number: 9, name: 'Sagittarius', sanskrit: 'Dhanu' },
    { number: 10, name: 'Capricorn', sanskrit: 'Makara' },
    { number: 11, name: 'Aquarius', sanskrit: 'Kumbha' },
    { number: 12, name: 'Pisces', sanskrit: 'Meena' },
];
/**
 * Ayanamsa systems - re-export for convenience
 */
exports.AYANAMSA = types_1.AyanamsaType;
/**
 * House systems - re-export for convenience
 */
exports.HOUSE_SYSTEMS = types_1.HouseSystem;
/**
 * Default calculation flags for Swiss Ephemeris
 */
exports.CALC_FLAGS = {
    SIDEREAL: 0x10000, // SEFLG_SIDEREAL
    SPEED: 0x0100, // SEFLG_SPEED
    SWIEPH: 0x0002, // SEFLG_SWIEPH (use Swiss Ephemeris files)
    EQUATORIAL: 0x0800, // SEFLG_EQUATORIAL
    XYZ: 0x0200, // SEFLG_XYZ
    TOPOCENTRIC: 0x2000, // SEFLG_TOPOCTR
};
/**
 * Moon phase names
 */
exports.MOON_PHASES = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent',
];
/**
 * Nakshatra (lunar mansion) data
 */
exports.NAKSHATRAS = [
    { number: 1, name: 'Ashwini', lord: exports.PLANETS.KETU },
    { number: 2, name: 'Bharani', lord: exports.PLANETS.VENUS },
    { number: 3, name: 'Krittika', lord: exports.PLANETS.SUN },
    { number: 4, name: 'Rohini', lord: exports.PLANETS.MOON },
    { number: 5, name: 'Mrigashira', lord: exports.PLANETS.MARS },
    { number: 6, name: 'Ardra', lord: exports.PLANETS.RAHU },
    { number: 7, name: 'Punarvasu', lord: exports.PLANETS.JUPITER },
    { number: 8, name: 'Pushya', lord: exports.PLANETS.SATURN },
    { number: 9, name: 'Ashlesha', lord: exports.PLANETS.MERCURY },
    { number: 10, name: 'Magha', lord: exports.PLANETS.KETU },
    { number: 11, name: 'Purva Phalguni', lord: exports.PLANETS.VENUS },
    { number: 12, name: 'Uttara Phalguni', lord: exports.PLANETS.SUN },
    { number: 13, name: 'Hasta', lord: exports.PLANETS.MOON },
    { number: 14, name: 'Chitra', lord: exports.PLANETS.MARS },
    { number: 15, name: 'Swati', lord: exports.PLANETS.RAHU },
    { number: 16, name: 'Vishakha', lord: exports.PLANETS.JUPITER },
    { number: 17, name: 'Anuradha', lord: exports.PLANETS.SATURN },
    { number: 18, name: 'Jyeshtha', lord: exports.PLANETS.MERCURY },
    { number: 19, name: 'Mula', lord: exports.PLANETS.KETU },
    { number: 20, name: 'Purva Ashadha', lord: exports.PLANETS.VENUS },
    { number: 21, name: 'Uttara Ashadha', lord: exports.PLANETS.SUN },
    { number: 22, name: 'Shravana', lord: exports.PLANETS.MOON },
    { number: 23, name: 'Dhanishta', lord: exports.PLANETS.MARS },
    { number: 24, name: 'Shatabhisha', lord: exports.PLANETS.RAHU },
    { number: 25, name: 'Purva Bhadrapada', lord: exports.PLANETS.JUPITER },
    { number: 26, name: 'Uttara Bhadrapada', lord: exports.PLANETS.SATURN },
    { number: 27, name: 'Revati', lord: exports.PLANETS.MERCURY },
];
/**
 * Julian Day for Unix Epoch (1970-01-01)
 */
exports.JULIAN_UNIX_EPOCH = 2440587.5;
/**
 * Average length of a lunar month in days
 */
exports.LUNAR_MONTH_DAYS = 29.530588853;
/**
 * Default average Earth-Moon distance in kilometers
 */
exports.DEFAULT_MOON_DISTANCE_KM = 384400;
/**
 * Astronomical Unit in kilometers (1 AU = 149,597,870.7 km)
 */
exports.AU_IN_KM = 149597870.7;
//# sourceMappingURL=constants.js.map