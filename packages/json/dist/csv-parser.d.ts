/**
 * Lightweight CSV parser for ephemeris data files.
 * No external dependencies — handles the specific format produced by
 * scripts/generate-ephemeris.js.
 */
import type { DailyPlanetaryRow, MoonRow } from './types';
/**
 * Parse the full main.csv content into a map keyed by "YYYY-MM-DD".
 */
export declare function parseDailyCSV(csv: string): Map<string, DailyPlanetaryRow>;
/**
 * Parse moon.csv (6-hourly) into a map keyed by "YYYY-MM-DD".
 * Each key maps to an array of up to 4 intra-day rows, sorted by time.
 */
export declare function parseMoonCSV(csv: string): Map<string, MoonRow[]>;
//# sourceMappingURL=csv-parser.d.ts.map