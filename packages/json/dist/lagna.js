"use strict";
/**
 * Fast Lagna (Ascendant) calculator — pure JS, no native dependencies.
 *
 * Algorithm:
 *   1. Convert date/time to Julian Day
 *   2. Calculate Greenwich Mean Sidereal Time (GMST)
 *   3. Add longitude offset to get Local Sidereal Time (LST)
 *   4. LST = RAMC (Right Ascension of Midheaven Cusp / 10th house)
 *   5. Compute Obliquity of Ecliptic (IAU formula)
 *   6. Solve for the Ascendant longitude on the ecliptic
 *   7. Subtract ayanamsa for sidereal result
 *
 * Accuracy: within ~0.5° of SWEPH for latitudes ±60°. Not suitable for
 * extreme latitudes (>65°) or house cusp calculations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFastLagna = getFastLagna;
const interpolate_1 = require("./interpolate");
const ayanamsa_1 = require("./ayanamsa");
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
/**
 * Mean obliquity of the ecliptic (IAU 1980 formula).
 * T = Julian centuries from J2000.0
 */
function obliquity(jd) {
    const T = (jd - 2451545.0) / 36525;
    return 23.439291111 - T * (0.013004167 + T * (0.000000164 - T * 0.000000504));
}
/**
 * Greenwich Mean Sidereal Time in degrees for a Julian Day (UT).
 * IAU 1982 formula.
 */
function gmst(jd) {
    const T = (jd - 2451545.0) / 36525;
    const gmstSeconds = 67310.54841 +
        T * (3164400184.812866 + T * (0.093104 - T * 0.0000062));
    return (0, interpolate_1.norm360)(gmstSeconds / 240); // seconds → degrees
}
/**
 * Calculate the tropical Ascendant longitude.
 *
 * @param lst   Local Sidereal Time in degrees
 * @param lat   Geographic latitude in degrees
 * @param eps   Obliquity of the ecliptic in degrees
 */
function ascendantTropical(lst, lat, eps) {
    const lstRad = lst * DEG2RAD;
    const latRad = lat * DEG2RAD;
    const epsRad = eps * DEG2RAD;
    // Standard ascendant formula
    const y = -Math.cos(lstRad);
    const x = Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad);
    let asc = Math.atan2(y, x) * RAD2DEG;
    asc = (0, interpolate_1.norm360)(asc);
    // Quadrant correction: LST determines which half of the ecliptic is rising
    if (lst >= 0 && lst < 180) {
        asc = (0, interpolate_1.norm360)(asc + 180);
    }
    return asc;
}
/**
 * Calculate Lagna (sidereal Ascendant) for a given date and location.
 *
 * @param date          Local birth date/time as a UTC Date object
 * @param latitude      Geographic latitude in decimal degrees (+N / -S)
 * @param longitude     Geographic longitude in decimal degrees (+E / -W)
 * @param ayanamsaType  Ayanamsa system (default: LAHIRI)
 */
function getFastLagna(date, latitude, longitude, ayanamsaType = ayanamsa_1.AYANAMSA_TYPE.LAHIRI) {
    const jd = (0, ayanamsa_1.dateToJD)(date);
    const eps = obliquity(jd);
    const gst = gmst(jd);
    const lst = (0, interpolate_1.norm360)(gst + longitude);
    const tropicalAsc = ascendantTropical(lst, latitude, eps);
    const ayanamsa = (0, ayanamsa_1.getAyanamsa)(date, ayanamsaType);
    const siderealAsc = (0, interpolate_1.norm360)(tropicalAsc - ayanamsa);
    const rasi = Math.floor(siderealAsc / 30) + 1;
    const rasiDegree = siderealAsc % 30;
    const nakshatra = Math.floor(siderealAsc / (360 / 27)) + 1;
    return {
        longitude: siderealAsc,
        rasi,
        rasiDegree,
        nakshatra,
    };
}
//# sourceMappingURL=lagna.js.map