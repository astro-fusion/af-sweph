"use strict";
/**
 * Ayanamsa (precession correction) formulas.
 *
 * All formulas use T = Julian centuries from J2000.0 (TT epoch).
 * Results are in degrees.
 *
 * Sources:
 *   - Lahiri: IAU 1956 Indian Astronomical Ephemeris
 *   - Krishnamurti: Krishnamurti Padhdhati (KP)
 *   - Raman: B.V. Raman's ayanamsa
 *   - Yukteshwar: Sri Yukteshwar's "Holy Science" (1894)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AYANAMSA_TYPE = void 0;
exports.dateToJD = dateToJD;
exports.getAyanamsa = getAyanamsa;
exports.toSidereal = toSidereal;
/** J2000.0 as Julian Day Number */
const J2000 = 2451545.0;
/** Julian Day for 1900 Jan 0.5 UT (epoch used by some formulas) */
const J1900 = 2415020.0;
/**
 * Convert a Date to Julian Day Number (UTC-based approximation).
 */
function dateToJD(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate() +
        date.getUTCHours() / 24 +
        date.getUTCMinutes() / 1440 +
        date.getUTCSeconds() / 86400;
    let jy = y;
    let jm = m;
    if (m <= 2) {
        jy = y - 1;
        jm = m + 12;
    }
    const A = Math.floor(jy / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + d + B - 1524.5;
}
/** Julian centuries from J2000.0 */
function T2000(jd) {
    return (jd - J2000) / 36525;
}
/** Julian centuries from J1900.0 */
function T1900(jd) {
    return (jd - J1900) / 36525;
}
// ============================================================================
// Per-ayanamsa formulas
// ============================================================================
/** Lahiri (Chitrapaksha) ayanamsa — matches Swiss Ephemeris SE_SIDM_LAHIRI */
function lahiri(jd) {
    const T = T2000(jd);
    return 23.85358 + T * (1.3960 + T * 0.0000326);
}
/**
 * Krishnamurti (KP) ayanamsa.
 * KP uses a different starting epoch than Lahiri.
 * Reference: SE_SIDM_KRISHNAMURTI = 5
 */
function krishnamurti(jd) {
    const T = T2000(jd);
    // KP ayanamsa = Lahiri - 0.25° (approximate offset used by KP system)
    return lahiri(jd) - 0.25 + T * 0.000022;
}
/** B.V. Raman's ayanamsa */
function raman(jd) {
    const T = T1900(jd);
    return 22.4600 + T * (1.3968 + T * 0.0000326);
}
/** Sri Yukteshwar's ayanamsa */
function yukteshwar(jd) {
    // Yukteshwar's "Holy Science": ayanamsa = 0 in 499 CE
    // Simple linear model matching his teaching
    const yearsFrom499 = (jd - 1903286.5) / 365.25;
    return (yearsFrom499 * 54) / 3600; // 54 arc-seconds per year
}
/** J.N. Bhasin ayanamsa (close to Lahiri with slight offset) */
function jnBhasin(jd) {
    return lahiri(jd) - 0.0417;
}
// ============================================================================
// Public API
// ============================================================================
/**
 * Swiss Ephemeris sidereal mode IDs (numeric constants).
 * Subset — only what's supported by polynomial formulas here.
 */
exports.AYANAMSA_TYPE = {
    LAHIRI: 1,
    RAMAN: 3,
    KRISHNAMURTI: 5,
    YUKTESHWAR: 7,
    JN_BHASIN: 8,
};
/**
 * Calculate ayanamsa value for a given date.
 *
 * @param date  The date/time
 * @param type  Ayanamsa type constant (default: LAHIRI = 1)
 * @returns     Ayanamsa in degrees
 */
function getAyanamsa(date, type = exports.AYANAMSA_TYPE.LAHIRI) {
    const jd = dateToJD(date);
    switch (type) {
        case exports.AYANAMSA_TYPE.LAHIRI: return lahiri(jd);
        case exports.AYANAMSA_TYPE.KRISHNAMURTI: return krishnamurti(jd);
        case exports.AYANAMSA_TYPE.RAMAN: return raman(jd);
        case exports.AYANAMSA_TYPE.YUKTESHWAR: return yukteshwar(jd);
        case exports.AYANAMSA_TYPE.JN_BHASIN: return jnBhasin(jd);
        default: return lahiri(jd);
    }
}
/**
 * Convert a tropical longitude to sidereal using the specified ayanamsa.
 */
function toSidereal(tropicalLongitude, date, ayanamsaType = exports.AYANAMSA_TYPE.LAHIRI) {
    const ayanamsa = getAyanamsa(date, ayanamsaType);
    return ((tropicalLongitude - ayanamsa) % 360 + 360) % 360;
}
//# sourceMappingURL=ayanamsa.js.map