"use strict";
/**
 * Lightweight CSV parser for ephemeris data files.
 * No external dependencies — handles the specific format produced by
 * scripts/generate-ephemeris.js.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDailyCSV = parseDailyCSV;
exports.parseMoonCSV = parseMoonCSV;
function toNum(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
}
/**
 * Parse the full main.csv content into a map keyed by "YYYY-MM-DD".
 */
function parseDailyCSV(csv) {
    const result = new Map();
    const lines = csv.split('\n');
    if (lines.length < 2)
        return result;
    const headers = lines[0].split(',');
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const cols = line.split(',');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const row = {};
        headers.forEach((h, idx) => {
            const key = h.trim();
            const val = cols[idx]?.trim() ?? '0';
            row[key] = key === 'date' ? val : toNum(val);
        });
        if (row.date) {
            result.set(row.date, row);
        }
    }
    return result;
}
/**
 * Parse moon.csv (6-hourly) into a map keyed by "YYYY-MM-DD".
 * Each key maps to an array of up to 4 intra-day rows, sorted by time.
 */
function parseMoonCSV(csv) {
    const result = new Map();
    const lines = csv.split('\n');
    if (lines.length < 2)
        return result;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const [dateStr, moonLong, moonSpeed] = line.split(',');
        if (!dateStr)
            continue;
        // Date may be "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
        const dayKey = dateStr.trim().slice(0, 10);
        const row = {
            date: dateStr.trim(),
            moon_long: toNum(moonLong),
            moon_speed: toNum(moonSpeed),
        };
        if (!result.has(dayKey))
            result.set(dayKey, []);
        result.get(dayKey).push(row);
    }
    return result;
}
//# sourceMappingURL=csv-parser.js.map