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
import type { DailyPlanetaryRow, IEphemerisLoader } from './types';
export declare class EphemerisStore {
    private readonly loader;
    private readonly preloaded;
    private readonly preloadedMoon;
    constructor(loader: IEphemerisLoader | null, preloaded?: Record<number, string>, preloadedMoon?: Record<number, string>);
    private loadYear;
    private loadMoonYear;
    private getRows;
    /**
     * Get the interpolated daily row for a UTC date.
     * Returns null if the data is not available for that year.
     */
    getInterpolated(date: Date): Promise<DailyPlanetaryRow | null>;
    /**
     * Get interpolated Moon longitude using higher-resolution 6-hourly data.
     * Falls back to daily interpolation if moon data is not available.
     */
    getMoonInterpolated(date: Date): Promise<{
        moon_long: number;
        moon_speed: number;
    } | null>;
}
//# sourceMappingURL=loader.d.ts.map