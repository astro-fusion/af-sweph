/**
 * Lightweight CSV parser for ephemeris data files.
 * No external dependencies — handles the specific format produced by
 * scripts/generate-ephemeris.js.
 */

import type { DailyPlanetaryRow, MoonRow } from './types';

function toNum(v: string): number {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}

/**
 * Parse the full main.csv content into a map keyed by "YYYY-MM-DD".
 */
export function parseDailyCSV(csv: string): Map<string, DailyPlanetaryRow> {
    const result = new Map<string, DailyPlanetaryRow>();
    const lines = csv.split('\n');
    if (lines.length < 2) return result;

    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row: any = {};
        headers.forEach((h, idx) => {
            const key = h.trim();
            const val = cols[idx]?.trim() ?? '0';
            row[key] = key === 'date' ? val : toNum(val);
        });

        if (row.date) {
            result.set(row.date as string, row as DailyPlanetaryRow);
        }
    }

    return result;
}

/**
 * Parse moon.csv (6-hourly) into a map keyed by "YYYY-MM-DD".
 * Each key maps to an array of up to 4 intra-day rows, sorted by time.
 */
export function parseMoonCSV(csv: string): Map<string, MoonRow[]> {
    const result = new Map<string, MoonRow[]>();
    const lines = csv.split('\n');
    if (lines.length < 2) return result;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [dateStr, moonLong, moonSpeed] = line.split(',');
        if (!dateStr) continue;

        // Date may be "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
        const dayKey = dateStr.trim().slice(0, 10);
        const row: MoonRow = {
            date: dateStr.trim(),
            moon_long: toNum(moonLong),
            moon_speed: toNum(moonSpeed),
        };

        if (!result.has(dayKey)) result.set(dayKey, []);
        result.get(dayKey)!.push(row);
    }

    return result;
}
