"use strict";
/**
 * Ephemeris data loader — manages year-by-year CSV loading and parsing.
 *
 * Design:
 * - The caller provides an IEphemerisLoader that knows HOW to fetch CSV strings.
 * - This class parses, caches, and interpolates from the loaded data.
 * - Parsed data is kept in a per-year in-memory Map for the process lifetime.
 *
 * Typical usage on Vercel serverless:
 *   - Warm container: year already parsed, lookup is O(1) hash map
 *   - Cold start: CSV parsed once (~3ms), subsequent requests are instant
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EphemerisStore = void 0;
const csv_parser_1 = require("./csv-parser");
const interpolate_1 = require("./interpolate");
// Per-year caches (persist across Lambda invocations in warm containers)
const yearlyCache = new Map();
const moonYearlyCache = new Map();
const loadingYears = new Map();
const loadingMoonYears = new Map();
class EphemerisStore {
    loader;
    preloaded;
    preloadedMoon;
    constructor(loader, preloaded = {}, preloadedMoon = {}) {
        this.loader = loader;
        this.preloaded = preloaded;
        this.preloadedMoon = preloadedMoon;
    }
    // -----------------------------------------------------------------------
    // Year loading
    // -----------------------------------------------------------------------
    async loadYear(year) {
        if (yearlyCache.has(year))
            return yearlyCache.get(year);
        // Deduplicate concurrent loads for the same year
        if (loadingYears.has(year))
            return loadingYears.get(year);
        const p = (async () => {
            let csv;
            if (this.preloaded[year] !== undefined) {
                csv = this.preloaded[year];
            }
            else if (this.loader) {
                csv = await this.loader.loadYear(year);
            }
            else {
                return new Map();
            }
            const parsed = (0, csv_parser_1.parseDailyCSV)(csv);
            yearlyCache.set(year, parsed);
            loadingYears.delete(year);
            return parsed;
        })();
        loadingYears.set(year, p);
        return p;
    }
    async loadMoonYear(year) {
        if (moonYearlyCache.has(year))
            return moonYearlyCache.get(year);
        if (loadingMoonYears.has(year))
            return loadingMoonYears.get(year);
        const p = (async () => {
            let csv;
            if (this.preloadedMoon[year] !== undefined) {
                csv = this.preloadedMoon[year];
            }
            else if (this.loader?.loadMoonYear) {
                csv = await this.loader.loadMoonYear(year);
            }
            else {
                return new Map();
            }
            const parsed = (0, csv_parser_1.parseMoonCSV)(csv);
            moonYearlyCache.set(year, parsed);
            loadingMoonYears.delete(year);
            return parsed;
        })();
        loadingMoonYears.set(year, p);
        return p;
    }
    // -----------------------------------------------------------------------
    // Row retrieval with cross-year boundary support
    // -----------------------------------------------------------------------
    async getRows(year, dayKey, nextKey) {
        const cache = await this.loadYear(year);
        let row = cache.get(dayKey) ?? null;
        let nextRow = cache.get(nextKey) ?? null;
        // Cross-year boundary (Dec 31 → Jan 1)
        if (!nextRow) {
            const nextCache = await this.loadYear(year + 1);
            nextRow = nextCache.get(nextKey) ?? null;
        }
        return { row, nextRow };
    }
    // -----------------------------------------------------------------------
    // Public interpolation API
    // -----------------------------------------------------------------------
    /**
     * Get the interpolated daily row for a UTC date.
     * Returns null if the data is not available for that year.
     */
    async getInterpolated(date) {
        const year = date.getUTCFullYear();
        const dayKey = (0, interpolate_1.toUTCDayKey)(date);
        const nKey = (0, interpolate_1.nextDayKey)(dayKey);
        const t = (0, interpolate_1.dayFraction)(date);
        const { row, nextRow } = await this.getRows(year, dayKey, nKey);
        if (!row)
            return null;
        if (!nextRow || t === 0)
            return row;
        // Interpolate every field
        return {
            date: row.date,
            ayanamsa: (0, interpolate_1.interpolateScalar)(row.ayanamsa, nextRow.ayanamsa, t),
            sun_declination: (0, interpolate_1.interpolateScalar)(row.sun_declination, nextRow.sun_declination, t),
            equation_of_time: (0, interpolate_1.interpolateScalar)(row.equation_of_time, nextRow.equation_of_time, t),
            sun_long: (0, interpolate_1.interpolateLongitude)(row.sun_long, nextRow.sun_long, t),
            sun_speed: (0, interpolate_1.interpolateScalar)(row.sun_speed, nextRow.sun_speed, t),
            moon_long: (0, interpolate_1.interpolateLongitude)(row.moon_long, nextRow.moon_long, t),
            moon_speed: (0, interpolate_1.interpolateScalar)(row.moon_speed, nextRow.moon_speed, t),
            mars_long: (0, interpolate_1.interpolateLongitude)(row.mars_long, nextRow.mars_long, t),
            mars_speed: (0, interpolate_1.interpolateScalar)(row.mars_speed, nextRow.mars_speed, t),
            mercury_long: (0, interpolate_1.interpolateLongitude)(row.mercury_long, nextRow.mercury_long, t),
            mercury_speed: (0, interpolate_1.interpolateScalar)(row.mercury_speed, nextRow.mercury_speed, t),
            jupiter_long: (0, interpolate_1.interpolateLongitude)(row.jupiter_long, nextRow.jupiter_long, t),
            jupiter_speed: (0, interpolate_1.interpolateScalar)(row.jupiter_speed, nextRow.jupiter_speed, t),
            venus_long: (0, interpolate_1.interpolateLongitude)(row.venus_long, nextRow.venus_long, t),
            venus_speed: (0, interpolate_1.interpolateScalar)(row.venus_speed, nextRow.venus_speed, t),
            saturn_long: (0, interpolate_1.interpolateLongitude)(row.saturn_long, nextRow.saturn_long, t),
            saturn_speed: (0, interpolate_1.interpolateScalar)(row.saturn_speed, nextRow.saturn_speed, t),
            uranus_long: (0, interpolate_1.interpolateLongitude)(row.uranus_long, nextRow.uranus_long, t),
            uranus_speed: (0, interpolate_1.interpolateScalar)(row.uranus_speed, nextRow.uranus_speed, t),
            neptune_long: (0, interpolate_1.interpolateLongitude)(row.neptune_long, nextRow.neptune_long, t),
            neptune_speed: (0, interpolate_1.interpolateScalar)(row.neptune_speed, nextRow.neptune_speed, t),
            pluto_long: (0, interpolate_1.interpolateLongitude)(row.pluto_long, nextRow.pluto_long, t),
            pluto_speed: (0, interpolate_1.interpolateScalar)(row.pluto_speed, nextRow.pluto_speed, t),
            rahu_long: (0, interpolate_1.interpolateLongitude)(row.rahu_long, nextRow.rahu_long, t),
            rahu_speed: (0, interpolate_1.interpolateScalar)(row.rahu_speed, nextRow.rahu_speed, t),
            ketu_long: (0, interpolate_1.interpolateLongitude)(row.ketu_long, nextRow.ketu_long, t),
            ketu_speed: (0, interpolate_1.interpolateScalar)(row.ketu_speed, nextRow.ketu_speed, t),
        };
    }
    /**
     * Get interpolated Moon longitude using higher-resolution 6-hourly data.
     * Falls back to daily interpolation if moon data is not available.
     */
    async getMoonInterpolated(date) {
        const year = date.getUTCFullYear();
        const dayKey = (0, interpolate_1.toUTCDayKey)(date);
        const moonCache = await this.loadMoonYear(year);
        const dayEntries = moonCache.get(dayKey);
        if (!dayEntries || dayEntries.length < 2) {
            // Fall back to daily row
            const row = await this.getInterpolated(date);
            return row ? { moon_long: row.moon_long, moon_speed: row.moon_speed } : null;
        }
        // Find surrounding 6-hourly brackets
        const msInDay = date.getTime() - Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
        const hours = msInDay / 3_600_000;
        // Find the bracket: entries are at 0h, 6h, 12h, 18h
        let lo = dayEntries[0];
        let hi = dayEntries[1];
        for (let i = 0; i < dayEntries.length - 1; i++) {
            const loHour = parseEntryHour(dayEntries[i].date);
            const hiHour = parseEntryHour(dayEntries[i + 1].date);
            if (hours >= loHour && hours < hiHour) {
                lo = dayEntries[i];
                hi = dayEntries[i + 1];
                break;
            }
        }
        const loHour = parseEntryHour(lo.date);
        const hiHour = parseEntryHour(hi.date);
        const span = hiHour - loHour || 6;
        const t = Math.min(1, Math.max(0, (hours - loHour) / span));
        return {
            moon_long: (0, interpolate_1.interpolateLongitude)(lo.moon_long, hi.moon_long, t),
            moon_speed: (0, interpolate_1.interpolateScalar)(lo.moon_speed, hi.moon_speed, t),
        };
    }
}
exports.EphemerisStore = EphemerisStore;
function parseEntryHour(dateStr) {
    // "YYYY-MM-DD HH:MM:SS" or just "YYYY-MM-DD"
    if (dateStr.length > 10) {
        return parseInt(dateStr.slice(11, 13), 10) || 0;
    }
    return 0;
}
//# sourceMappingURL=loader.js.map