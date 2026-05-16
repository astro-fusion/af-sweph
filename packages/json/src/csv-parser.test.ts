/**
 * Tests for CSV parser — all fixtures are inline strings, no filesystem access.
 */

import { describe, it, expect } from 'vitest';
import { parseDailyCSV, parseMoonCSV } from './csv-parser';

// ============================================================================
// Inline CSV fixtures
// ============================================================================

// Three rows from the real 2024 dataset (validated against source files)
const DAILY_CSV_3_ROWS = `date,ayanamsa,sun_declination,equation_of_time,sun_long,sun_speed,moon_long,moon_speed,mars_long,mars_speed,mercury_long,mercury_speed,jupiter_long,jupiter_speed,venus_long,venus_speed,saturn_long,saturn_speed,uranus_long,uranus_speed,neptune_long,neptune_speed,pluto_long,pluto_speed,rahu_long,rahu_speed,ketu_long,ketu_speed
2024-01-01,24.1924,-23.0191,-3.29,280.5485,1.0190,161.9070,11.8138,267.6792,0.7418,262.2120,-0.0989,35.5844,0.0048,243.2205,1.2165,333.2880,0.0890,49.3731,-0.0215,355.0834,0.0148,299.3731,0.0311,21.0339,-0.0763,201.0339,-0.0763
2024-01-02,24.1924,-22.9347,-3.76,281.5676,1.0191,173.7085,11.8027,268.4214,0.7426,262.1915,0.0560,35.5909,0.0083,244.4374,1.2175,333.3775,0.0901,49.3519,-0.0208,355.0985,0.0154,299.4043,0.0312,20.9791,-0.0355,200.9791,-0.0355
2024-01-03,24.1924,-22.8427,-4.22,282.5867,1.0192,185.5412,11.8777,269.1643,0.7433,262.3201,0.1992,35.6009,0.0117,245.6554,1.2184,333.4682,0.0912,49.3315,-0.0200,355.1141,0.0159,299.4356,0.0314,20.9581,-0.0090,200.9581,-0.0090`;

// 6-hourly moon data (real format: timestamp,moon_long,moon_speed,moon_lat)
const MOON_CSV_2_DAYS = `timestamp,moon_long,moon_speed,moon_lat
2024-01-01T00:00:00.000Z,155.99218,11.84840,3.56764
2024-01-01T06:00:00.000Z,158.95175,11.82886,3.37960
2024-01-01T12:00:00.000Z,161.90700,11.81383,3.18264
2024-01-01T18:00:00.000Z,164.85907,11.80351,2.97724
2024-01-02T00:00:00.000Z,167.80917,11.79811,2.76389
2024-01-02T06:00:00.000Z,170.75856,11.79779,2.54309`;

// ============================================================================
// parseDailyCSV
// ============================================================================

describe('parseDailyCSV', () => {
    it('returns a Map with one entry per data row', () => {
        const result = parseDailyCSV(DAILY_CSV_3_ROWS);
        expect(result.size).toBe(3);
    });

    it('keys are YYYY-MM-DD strings', () => {
        const result = parseDailyCSV(DAILY_CSV_3_ROWS);
        expect(result.has('2024-01-01')).toBe(true);
        expect(result.has('2024-01-02')).toBe(true);
        expect(result.has('2024-01-03')).toBe(true);
    });

    it('date field is a string', () => {
        const result = parseDailyCSV(DAILY_CSV_3_ROWS);
        const row = result.get('2024-01-01')!;
        expect(typeof row.date).toBe('string');
        expect(row.date).toBe('2024-01-01');
    });

    it('numeric fields are parsed as numbers', () => {
        const result = parseDailyCSV(DAILY_CSV_3_ROWS);
        const row = result.get('2024-01-01')!;
        expect(typeof row.ayanamsa).toBe('number');
        expect(typeof row.sun_long).toBe('number');
        expect(typeof row.moon_long).toBe('number');
        expect(typeof row.mercury_speed).toBe('number');
    });

    describe('row values for 2024-01-01', () => {
        it('ayanamsa matches CSV value', () => {
            const row = parseDailyCSV(DAILY_CSV_3_ROWS).get('2024-01-01')!;
            expect(row.ayanamsa).toBeCloseTo(24.1924, 4);
        });

        it('sun_declination is negative (winter solstice period)', () => {
            const row = parseDailyCSV(DAILY_CSV_3_ROWS).get('2024-01-01')!;
            expect(row.sun_declination).toBeCloseTo(-23.0191, 4);
        });

        it('sun_long is tropical longitude ~280°', () => {
            const row = parseDailyCSV(DAILY_CSV_3_ROWS).get('2024-01-01')!;
            expect(row.sun_long).toBeCloseTo(280.5485, 4);
        });

        it('mercury_speed is negative (retrograde)', () => {
            const row = parseDailyCSV(DAILY_CSV_3_ROWS).get('2024-01-01')!;
            expect(row.mercury_speed).toBeCloseTo(-0.0989, 4);
        });

        it('rahu_long and ketu_long are 180° apart', () => {
            const row = parseDailyCSV(DAILY_CSV_3_ROWS).get('2024-01-01')!;
            // rahu=21.0339, ketu=201.0339 — differ by exactly 180°
            expect(Math.abs(row.ketu_long - row.rahu_long)).toBeCloseTo(180, 2);
        });

        it('all longitude fields are in reasonable range [0, 360)', () => {
            const row = parseDailyCSV(DAILY_CSV_3_ROWS).get('2024-01-01')!;
            const longFields = [
                'sun_long', 'moon_long', 'mars_long', 'mercury_long',
                'jupiter_long', 'venus_long', 'saturn_long', 'uranus_long',
                'neptune_long', 'pluto_long', 'rahu_long', 'ketu_long',
            ] as const;
            for (const field of longFields) {
                const val = (row as Record<string, number>)[field];
                expect(val).toBeGreaterThanOrEqual(0);
                expect(val).toBeLessThan(360);
            }
        });
    });

    it('parses all three rows correctly', () => {
        const result = parseDailyCSV(DAILY_CSV_3_ROWS);
        const row2 = result.get('2024-01-02')!;
        expect(row2.sun_long).toBeCloseTo(281.5676, 4);
        const row3 = result.get('2024-01-03')!;
        expect(row3.moon_long).toBeCloseTo(185.5412, 4);
    });

    describe('edge cases', () => {
        it('returns empty map for header-only CSV', () => {
            const headerOnly = `date,ayanamsa,sun_long,sun_speed`;
            expect(parseDailyCSV(headerOnly).size).toBe(0);
        });

        it('returns empty map for empty string', () => {
            expect(parseDailyCSV('').size).toBe(0);
        });

        it('skips blank lines', () => {
            const withBlanks = `date,ayanamsa,sun_declination,equation_of_time,sun_long,sun_speed,moon_long,moon_speed,mars_long,mars_speed,mercury_long,mercury_speed,jupiter_long,jupiter_speed,venus_long,venus_speed,saturn_long,saturn_speed,uranus_long,uranus_speed,neptune_long,neptune_speed,pluto_long,pluto_speed,rahu_long,rahu_speed,ketu_long,ketu_speed
2024-01-01,24.1924,-23.0191,-3.29,280.5485,1.0190,161.9070,11.8138,267.6792,0.7418,262.2120,-0.0989,35.5844,0.0048,243.2205,1.2165,333.2880,0.0890,49.3731,-0.0215,355.0834,0.0148,299.3731,0.0311,21.0339,-0.0763,201.0339,-0.0763

2024-01-02,24.1924,-22.9347,-3.76,281.5676,1.0191,173.7085,11.8027,268.4214,0.7426,262.1915,0.0560,35.5909,0.0083,244.4374,1.2175,333.3775,0.0901,49.3519,-0.0208,355.0985,0.0154,299.4043,0.0312,20.9791,-0.0355,200.9791,-0.0355`;
            const result = parseDailyCSV(withBlanks);
            expect(result.size).toBe(2);
        });

        it('treats missing numeric fields as 0', () => {
            // Partial row — missing columns fall back to '0' → toNum('0') = 0
            const sparse = `date,ayanamsa,sun_long
2024-06-01,24.2,270.5`;
            const result = parseDailyCSV(sparse);
            const row = result.get('2024-06-01')!;
            expect(row.ayanamsa).toBeCloseTo(24.2, 2);
            expect(row.sun_long).toBeCloseTo(270.5, 2);
            // Fields not in CSV are undefined / 0
            expect(row.moon_long ?? 0).toBe(0);
        });
    });
});

// ============================================================================
// parseMoonCSV
// ============================================================================

describe('parseMoonCSV', () => {
    it('returns a Map keyed by YYYY-MM-DD', () => {
        const result = parseMoonCSV(MOON_CSV_2_DAYS);
        expect(result.has('2024-01-01')).toBe(true);
        expect(result.has('2024-01-02')).toBe(true);
    });

    it('groups 4 intra-day entries under 2024-01-01', () => {
        const result = parseMoonCSV(MOON_CSV_2_DAYS);
        const day1 = result.get('2024-01-01')!;
        expect(day1).toHaveLength(4);
    });

    it('groups 2 intra-day entries under 2024-01-02', () => {
        const result = parseMoonCSV(MOON_CSV_2_DAYS);
        const day2 = result.get('2024-01-02')!;
        expect(day2).toHaveLength(2);
    });

    it('preserves full timestamp in the date field of each MoonRow', () => {
        const result = parseMoonCSV(MOON_CSV_2_DAYS);
        const rows = result.get('2024-01-01')!;
        expect(rows[0].date).toBe('2024-01-01T00:00:00.000Z');
        expect(rows[2].date).toBe('2024-01-01T12:00:00.000Z');
    });

    it('parses moon_long as number', () => {
        const result = parseMoonCSV(MOON_CSV_2_DAYS);
        const rows = result.get('2024-01-01')!;
        expect(rows[0].moon_long).toBeCloseTo(155.99218, 4);
        expect(rows[2].moon_long).toBeCloseTo(161.90700, 4);
    });

    it('parses moon_speed as number', () => {
        const result = parseMoonCSV(MOON_CSV_2_DAYS);
        const rows = result.get('2024-01-01')!;
        expect(rows[0].moon_speed).toBeCloseTo(11.84840, 4);
    });

    it('moon_long increases monotonically (Moon moves direct in this period)', () => {
        const result = parseMoonCSV(MOON_CSV_2_DAYS);
        const rows = result.get('2024-01-01')!;
        for (let i = 1; i < rows.length; i++) {
            expect(rows[i].moon_long).toBeGreaterThan(rows[i - 1].moon_long);
        }
    });

    describe('edge cases', () => {
        it('returns empty map for empty string', () => {
            expect(parseMoonCSV('').size).toBe(0);
        });

        it('returns empty map for header-only CSV', () => {
            expect(parseMoonCSV('timestamp,moon_long,moon_speed,moon_lat').size).toBe(0);
        });

        it('handles plain YYYY-MM-DD dates (no time component)', () => {
            const plainDateCSV = `date,moon_long,moon_speed
2024-03-15,100.5,11.5
2024-03-15,112.0,11.4`;
            const result = parseMoonCSV(plainDateCSV);
            expect(result.has('2024-03-15')).toBe(true);
            expect(result.get('2024-03-15')).toHaveLength(2);
        });

        it('skips blank lines', () => {
            const withBlanks = `timestamp,moon_long,moon_speed,moon_lat
2024-05-01T00:00:00.000Z,90.0,12.0,1.0

2024-05-01T06:00:00.000Z,93.0,12.0,1.0`;
            const result = parseMoonCSV(withBlanks);
            expect(result.get('2024-05-01')).toHaveLength(2);
        });
    });
});
