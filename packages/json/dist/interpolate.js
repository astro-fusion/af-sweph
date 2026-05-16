"use strict";
/**
 * Linear interpolation utilities for ephemeris data.
 *
 * All planetary longitudes are on a circle [0, 360). The shortest-arc
 * interpolation handles the 359° → 1° wrap-around correctly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.norm360 = norm360;
exports.interpolateLongitude = interpolateLongitude;
exports.interpolateScalar = interpolateScalar;
exports.toUTCDayKey = toUTCDayKey;
exports.nextDayKey = nextDayKey;
exports.dayFraction = dayFraction;
/**
 * Normalise an angle to [0, 360).
 */
function norm360(deg) {
    return ((deg % 360) + 360) % 360;
}
/**
 * Linear interpolation with 360° wrap-around.
 *
 * @param a   Start value (degrees)
 * @param b   End value (degrees)
 * @param t   Fraction [0, 1] — how far between a and b
 */
function interpolateLongitude(a, b, t) {
    let diff = norm360(b) - norm360(a);
    // Take the shortest arc
    if (diff > 180)
        diff -= 360;
    if (diff < -180)
        diff += 360;
    return norm360(norm360(a) + diff * t);
}
/**
 * Linearly interpolate a plain scalar (speed, declination, etc.).
 */
function interpolateScalar(a, b, t) {
    return a + (b - a) * t;
}
/**
 * Convert a Date to a UTC day key "YYYY-MM-DD".
 */
function toUTCDayKey(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/**
 * Return the "YYYY-MM-DD" key for the next calendar day.
 */
function nextDayKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + 1));
    return toUTCDayKey(date);
}
/**
 * Fractional position within the UTC day [0, 1).
 */
function dayFraction(date) {
    const ms = date.getTime();
    const startOfDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return (ms - startOfDay) / 86_400_000;
}
//# sourceMappingURL=interpolate.js.map