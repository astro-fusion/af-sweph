/**
 * Constants for @AstroFusion/sweph
 */

import { PlanetId, AyanamsaType, HouseSystem } from './types';

/**
 * Planet definitions for Vedic astrology (9 grahas)
 */
export const PLANETS = {
  SUN: { id: PlanetId.SUN, name: 'Sun', sanskrit: 'Surya' },
  MOON: { id: PlanetId.MOON, name: 'Moon', sanskrit: 'Chandra' },
  MARS: { id: PlanetId.MARS, name: 'Mars', sanskrit: 'Mangal' },
  MERCURY: { id: PlanetId.MERCURY, name: 'Mercury', sanskrit: 'Budha' },
  JUPITER: { id: PlanetId.JUPITER, name: 'Jupiter', sanskrit: 'Guru' },
  VENUS: { id: PlanetId.VENUS, name: 'Venus', sanskrit: 'Shukra' },
  SATURN: { id: PlanetId.SATURN, name: 'Saturn', sanskrit: 'Shani' },
  RAHU: { id: PlanetId.TRUE_NODE, name: 'Rahu', sanskrit: 'Rahu' },
  KETU: { id: -1, name: 'Ketu', sanskrit: 'Ketu' }, // Calculated as 180° from Rahu
} as const;

/**
 * Vedic planet order (traditional order)
 */
export const VEDIC_PLANET_ORDER = [
  PLANETS.SUN,
  PLANETS.MOON,
  PLANETS.MARS,
  PLANETS.MERCURY,
  PLANETS.JUPITER,
  PLANETS.VENUS,
  PLANETS.SATURN,
  PLANETS.RAHU,
  PLANETS.KETU,
] as const;

/**
 * Rashi (zodiac sign) names
 */
export const RASHIS = [
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
] as const;

/**
 * Ayanamsa systems - re-export for convenience
 */
export const AYANAMSA = AyanamsaType;

/**
 * House systems - re-export for convenience
 */
export const HOUSE_SYSTEMS = HouseSystem;

/**
 * Default calculation flags for Swiss Ephemeris
 */
export const CALC_FLAGS = {
  SIDEREAL: 0x10000,    // SEFLG_SIDEREAL
  SPEED: 0x0100,        // SEFLG_SPEED
  SWIEPH: 0x0002,       // SEFLG_SWIEPH (use Swiss Ephemeris files)
  EQUATORIAL: 0x0800,   // SEFLG_EQUATORIAL
  XYZ: 0x0200,          // SEFLG_XYZ
  TOPOCENTRIC: 0x2000,  // SEFLG_TOPOCTR
} as const;

/**
 * Moon phase names
 */
export const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const;

/**
 * Nakshatra (lunar mansion) data
 */
export const NAKSHATRAS = [
  { number: 1, name: 'Ashwini', lord: PLANETS.KETU },
  { number: 2, name: 'Bharani', lord: PLANETS.VENUS },
  { number: 3, name: 'Krittika', lord: PLANETS.SUN },
  { number: 4, name: 'Rohini', lord: PLANETS.MOON },
  { number: 5, name: 'Mrigashira', lord: PLANETS.MARS },
  { number: 6, name: 'Ardra', lord: PLANETS.RAHU },
  { number: 7, name: 'Punarvasu', lord: PLANETS.JUPITER },
  { number: 8, name: 'Pushya', lord: PLANETS.SATURN },
  { number: 9, name: 'Ashlesha', lord: PLANETS.MERCURY },
  { number: 10, name: 'Magha', lord: PLANETS.KETU },
  { number: 11, name: 'Purva Phalguni', lord: PLANETS.VENUS },
  { number: 12, name: 'Uttara Phalguni', lord: PLANETS.SUN },
  { number: 13, name: 'Hasta', lord: PLANETS.MOON },
  { number: 14, name: 'Chitra', lord: PLANETS.MARS },
  { number: 15, name: 'Swati', lord: PLANETS.RAHU },
  { number: 16, name: 'Vishakha', lord: PLANETS.JUPITER },
  { number: 17, name: 'Anuradha', lord: PLANETS.SATURN },
  { number: 18, name: 'Jyeshtha', lord: PLANETS.MERCURY },
  { number: 19, name: 'Mula', lord: PLANETS.KETU },
  { number: 20, name: 'Purva Ashadha', lord: PLANETS.VENUS },
  { number: 21, name: 'Uttara Ashadha', lord: PLANETS.SUN },
  { number: 22, name: 'Shravana', lord: PLANETS.MOON },
  { number: 23, name: 'Dhanishta', lord: PLANETS.MARS },
  { number: 24, name: 'Shatabhisha', lord: PLANETS.RAHU },
  { number: 25, name: 'Purva Bhadrapada', lord: PLANETS.JUPITER },
  { number: 26, name: 'Uttara Bhadrapada', lord: PLANETS.SATURN },
  { number: 27, name: 'Revati', lord: PLANETS.MERCURY },
] as const;

/**
 * Julian Day for Unix Epoch (1970-01-01)
 */
export const JULIAN_UNIX_EPOCH = 2440587.5;

/**
 * Average length of a lunar month in days
 */
export const LUNAR_MONTH_DAYS = 29.530588853;
