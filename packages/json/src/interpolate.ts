/**
 * Linear interpolation utilities for ephemeris data.
 *
 * All planetary longitudes are on a circle [0, 360). The shortest-arc
 * interpolation handles the 359° → 1° wrap-around correctly.
 */

/**
 * Normalise an angle to [0, 360).
 */
export function norm360(deg: number): number {
    return ((deg % 360) + 360) % 360;
}

/**
 * Linear interpolation with 360° wrap-around.
 *
 * @param a   Start value (degrees)
 * @param b   End value (degrees)
 * @param t   Fraction [0, 1] — how far between a and b
 */
export function interpolateLongitude(a: number, b: number, t: number): number {
    let diff = norm360(b) - norm360(a);
    // Take the shortest arc
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return norm360(norm360(a) + diff * t);
}

/**
 * Linearly interpolate a plain scalar (speed, declination, etc.).
 */
export function interpolateScalar(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Convert a Date to a UTC day key "YYYY-MM-DD".
 */
export function toUTCDayKey(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Return the "YYYY-MM-DD" key for the next calendar day.
 */
export function nextDayKey(key: string): string {
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + 1));
    return toUTCDayKey(date);
}

/**
 * Fractional position within the UTC day [0, 1).
 */
export function dayFraction(date: Date): number {
    const ms = date.getTime();
    const startOfDay = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    );
    return (ms - startOfDay) / 86_400_000;
}
