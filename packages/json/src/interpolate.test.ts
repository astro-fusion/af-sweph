/**
 * Tests for interpolation utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
    norm360,
    interpolateLongitude,
    interpolateScalar,
    toUTCDayKey,
    nextDayKey,
    dayFraction,
} from './interpolate';

// ============================================================================
// norm360
// ============================================================================

describe('norm360', () => {
    it('returns value unchanged when already in [0, 360)', () => {
        expect(norm360(0)).toBe(0);
        expect(norm360(180)).toBe(180);
        expect(norm360(359.999)).toBeCloseTo(359.999, 5);
    });

    it('wraps negative values into [0, 360)', () => {
        expect(norm360(-10)).toBeCloseTo(350, 5);
        expect(norm360(-180)).toBeCloseTo(180, 5);
        expect(norm360(-360)).toBeCloseTo(0, 5);
        expect(norm360(-361)).toBeCloseTo(359, 5);
    });

    it('wraps values >= 360 into [0, 360)', () => {
        expect(norm360(360)).toBeCloseTo(0, 5);
        expect(norm360(370)).toBeCloseTo(10, 5);
        expect(norm360(720)).toBeCloseTo(0, 5);
        expect(norm360(721)).toBeCloseTo(1, 5);
    });

    it('handles exact boundary 360 → 0', () => {
        expect(norm360(360)).toBe(0);
    });

    it('handles double negative wrap', () => {
        expect(norm360(-720)).toBeCloseTo(0, 5);
        expect(norm360(-370)).toBeCloseTo(350, 5);
    });
});

// ============================================================================
// interpolateLongitude
// ============================================================================

describe('interpolateLongitude', () => {
    it('returns start value at t=0', () => {
        expect(interpolateLongitude(100, 200, 0)).toBeCloseTo(100, 5);
    });

    it('returns end value at t=1', () => {
        expect(interpolateLongitude(100, 200, 1)).toBeCloseTo(200, 5);
    });

    it('returns midpoint at t=0.5 for normal case', () => {
        expect(interpolateLongitude(100, 200, 0.5)).toBeCloseTo(150, 5);
    });

    it('interpolates Sun correctly between two daily rows (real CSV data)', () => {
        // 2024-01-01 sun_long=280.5485, 2024-01-02 sun_long=281.5676
        const mid = interpolateLongitude(280.5485, 281.5676, 0.5);
        expect(mid).toBeCloseTo(281.0581, 2);
    });

    it('handles 359° → 1° wrap-around (critical edge case)', () => {
        // Shortest arc from 359 to 1 is +2°, not -358°
        const mid = interpolateLongitude(359, 1, 0.5);
        expect(mid).toBeCloseTo(0, 5);
    });

    it('handles 358° → 2° wrap-around at various fractions', () => {
        expect(interpolateLongitude(358, 2, 0.25)).toBeCloseTo(359, 5);
        expect(interpolateLongitude(358, 2, 0.75)).toBeCloseTo(1, 5);
    });

    it('handles backward crossing (e.g. retrograde: 2° → 358°)', () => {
        // Shortest arc from 2 to 358 is -4°
        const mid = interpolateLongitude(2, 358, 0.5);
        expect(mid).toBeCloseTo(0, 5);
    });

    it('result is always in [0, 360)', () => {
        const cases = [
            [350, 10, 0.5],
            [180, 0, 0.5],
            [0, 360, 0.5],
            [270, 90, 0.5],
        ] as const;
        for (const [a, b, t] of cases) {
            const result = interpolateLongitude(a, b, t);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(360);
        }
    });
});

// ============================================================================
// interpolateScalar
// ============================================================================

describe('interpolateScalar', () => {
    it('returns start at t=0', () => {
        expect(interpolateScalar(10, 20, 0)).toBe(10);
    });

    it('returns end at t=1', () => {
        expect(interpolateScalar(10, 20, 1)).toBe(20);
    });

    it('returns midpoint at t=0.5', () => {
        expect(interpolateScalar(10, 20, 0.5)).toBeCloseTo(15, 5);
    });

    it('handles negative values (speeds, declination)', () => {
        expect(interpolateScalar(-5, 5, 0.5)).toBeCloseTo(0, 5);
        expect(interpolateScalar(-23.0191, -22.9347, 0.5)).toBeCloseTo(-22.9769, 3);
    });

    it('handles equal start and end', () => {
        expect(interpolateScalar(42, 42, 0.7)).toBe(42);
    });
});

// ============================================================================
// toUTCDayKey
// ============================================================================

describe('toUTCDayKey', () => {
    it('converts midnight UTC to YYYY-MM-DD', () => {
        expect(toUTCDayKey(new Date('2024-01-01T00:00:00Z'))).toBe('2024-01-01');
    });

    it('converts noon UTC to the same day key', () => {
        expect(toUTCDayKey(new Date('2024-06-15T12:00:00Z'))).toBe('2024-06-15');
    });

    it('pads single-digit months and days', () => {
        expect(toUTCDayKey(new Date('2024-03-05T00:00:00Z'))).toBe('2024-03-05');
    });

    it('uses UTC date, not local date', () => {
        // 2024-01-01T23:00:00Z is Jan 2 in UTC+2, but must return Jan 1
        const key = toUTCDayKey(new Date('2024-01-01T23:00:00Z'));
        expect(key).toBe('2024-01-01');
    });

    it('handles year boundaries', () => {
        expect(toUTCDayKey(new Date('2024-12-31T23:59:59Z'))).toBe('2024-12-31');
        expect(toUTCDayKey(new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01');
    });
});

// ============================================================================
// nextDayKey
// ============================================================================

describe('nextDayKey', () => {
    it('returns next day in same month', () => {
        expect(nextDayKey('2024-01-15')).toBe('2024-01-16');
    });

    it('rolls over month boundary', () => {
        expect(nextDayKey('2024-01-31')).toBe('2024-02-01');
    });

    it('rolls over year boundary (Dec 31 → Jan 1)', () => {
        expect(nextDayKey('2024-12-31')).toBe('2025-01-01');
    });

    it('handles Feb 28 → Feb 29 in a leap year', () => {
        expect(nextDayKey('2024-02-28')).toBe('2024-02-29');
    });

    it('handles Feb 28 → Mar 01 in a non-leap year', () => {
        expect(nextDayKey('2023-02-28')).toBe('2023-03-01');
    });

    it('handles end of November', () => {
        expect(nextDayKey('2024-11-30')).toBe('2024-12-01');
    });
});

// ============================================================================
// dayFraction
// ============================================================================

describe('dayFraction', () => {
    it('returns 0 at midnight UTC', () => {
        expect(dayFraction(new Date('2024-01-01T00:00:00Z'))).toBe(0);
    });

    it('returns 0.5 at noon UTC', () => {
        expect(dayFraction(new Date('2024-01-01T12:00:00Z'))).toBe(0.5);
    });

    it('returns ~0.958 at 23:00 UTC', () => {
        expect(dayFraction(new Date('2024-01-01T23:00:00Z'))).toBeCloseTo(23 / 24, 5);
    });

    it('returns ~0.25 at 06:00 UTC', () => {
        expect(dayFraction(new Date('2024-01-01T06:00:00Z'))).toBeCloseTo(0.25, 5);
    });

    it('is always in [0, 1)', () => {
        const dates = [
            new Date('2024-06-21T00:00:00Z'),
            new Date('2024-06-21T06:00:00Z'),
            new Date('2024-06-21T12:00:00Z'),
            new Date('2024-06-21T18:00:00Z'),
            new Date('2024-06-21T23:59:59Z'),
        ];
        for (const d of dates) {
            const f = dayFraction(d);
            expect(f).toBeGreaterThanOrEqual(0);
            expect(f).toBeLessThan(1);
        }
    });
});
