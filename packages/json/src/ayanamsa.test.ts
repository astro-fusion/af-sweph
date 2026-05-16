/**
 * Tests for ayanamsa (precession correction) calculations.
 */

import { describe, it, expect } from 'vitest';
import { dateToJD, getAyanamsa, toSidereal, AYANAMSA_TYPE } from './ayanamsa';

// ============================================================================
// dateToJD
// ============================================================================

describe('dateToJD', () => {
    it('returns J2000 epoch (2451545.0) for 2000-01-01 12:00 UTC', () => {
        const date = new Date('2000-01-01T12:00:00Z');
        expect(dateToJD(date)).toBeCloseTo(2451545.0, 4);
    });

    it('returns correct JD for a known historical date (J1900 epoch)', () => {
        // 1900-01-01 00:00 UTC → JD 2415020.5
        const date = new Date('1900-01-01T00:00:00Z');
        expect(dateToJD(date)).toBeCloseTo(2415020.5, 2);
    });

    it('returns JD 2460310.5 for 2024-01-01 00:00 UTC', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        expect(dateToJD(date)).toBeCloseTo(2460310.5, 2);
    });

    it('increases by 1.0 per day', () => {
        const day1 = new Date('2024-06-01T00:00:00Z');
        const day2 = new Date('2024-06-02T00:00:00Z');
        expect(dateToJD(day2) - dateToJD(day1)).toBeCloseTo(1.0, 5);
    });

    it('increases by 0.5 per 12 hours', () => {
        const morning = new Date('2024-01-15T00:00:00Z');
        const noon = new Date('2024-01-15T12:00:00Z');
        expect(dateToJD(noon) - dateToJD(morning)).toBeCloseTo(0.5, 5);
    });

    it('handles month boundary correctly (January uses previous-year formula)', () => {
        // Dates with month <= 2 use jy = y-1, jm = m+12 in the JD formula
        const jan = new Date('2024-01-15T00:00:00Z');
        const feb = new Date('2024-02-15T00:00:00Z');
        const mar = new Date('2024-03-15T00:00:00Z');
        // Jan 15 to Feb 15 = 31 days, Feb 15 to Mar 15 = 29 days (2024 is leap)
        expect(dateToJD(feb) - dateToJD(jan)).toBeCloseTo(31, 4);
        expect(dateToJD(mar) - dateToJD(feb)).toBeCloseTo(29, 4);
    });
});

// ============================================================================
// getAyanamsa — LAHIRI
// ============================================================================

describe('getAyanamsa — LAHIRI', () => {
    it('returns ~24.19° for 2024-01-01', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const ay = getAyanamsa(date, AYANAMSA_TYPE.LAHIRI);
        // CSV column for 2024-01-01 shows 24.1924; formula gives ~24.189
        expect(ay).toBeGreaterThan(24.0);
        expect(ay).toBeLessThan(24.4);
    });

    it('returns the default ayanamsa type (Lahiri) when no type specified', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        expect(getAyanamsa(date)).toBeCloseTo(getAyanamsa(date, AYANAMSA_TYPE.LAHIRI), 10);
    });

    it('increases over time (precession advances ~50.3 arcsec/year)', () => {
        const date2000 = new Date('2000-01-01T12:00:00Z');
        const date2024 = new Date('2024-01-01T12:00:00Z');
        expect(getAyanamsa(date2024, AYANAMSA_TYPE.LAHIRI)).toBeGreaterThan(
            getAyanamsa(date2000, AYANAMSA_TYPE.LAHIRI)
        );
    });

    it('advances by approximately 1.4° per century', () => {
        const date1900 = new Date('1900-01-01T12:00:00Z');
        const date2000 = new Date('2000-01-01T12:00:00Z');
        const diff = getAyanamsa(date2000, AYANAMSA_TYPE.LAHIRI) - getAyanamsa(date1900, AYANAMSA_TYPE.LAHIRI);
        expect(diff).toBeGreaterThan(1.3);
        expect(diff).toBeLessThan(1.5);
    });
});

// ============================================================================
// getAyanamsa — KRISHNAMURTI
// ============================================================================

describe('getAyanamsa — KRISHNAMURTI', () => {
    it('returns ~0.25° less than Lahiri for 2024', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const lahiri = getAyanamsa(date, AYANAMSA_TYPE.LAHIRI);
        const kp = getAyanamsa(date, AYANAMSA_TYPE.KRISHNAMURTI);
        const diff = lahiri - kp;
        // KP = Lahiri - 0.25 (approximately)
        expect(diff).toBeGreaterThan(0.24);
        expect(diff).toBeLessThan(0.26);
    });

    it('is always slightly less than Lahiri across years', () => {
        const dates = [
            new Date('2000-01-01T00:00:00Z'),
            new Date('2010-06-15T00:00:00Z'),
            new Date('2024-01-01T00:00:00Z'),
        ];
        for (const date of dates) {
            expect(getAyanamsa(date, AYANAMSA_TYPE.KRISHNAMURTI)).toBeLessThan(
                getAyanamsa(date, AYANAMSA_TYPE.LAHIRI)
            );
        }
    });
});

// ============================================================================
// getAyanamsa — RAMAN
// ============================================================================

describe('getAyanamsa — RAMAN', () => {
    it('returns approximately 22.7°–22.8° for 2024', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const ay = getAyanamsa(date, AYANAMSA_TYPE.RAMAN);
        expect(ay).toBeGreaterThan(22.5);
        expect(ay).toBeLessThan(23.0);
    });

    it('is less than Lahiri ayanamsa for contemporary dates', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        expect(getAyanamsa(date, AYANAMSA_TYPE.RAMAN)).toBeLessThan(
            getAyanamsa(date, AYANAMSA_TYPE.LAHIRI)
        );
    });
});

// ============================================================================
// getAyanamsa — YUKTESHWAR
// ============================================================================

describe('getAyanamsa — YUKTESHWAR', () => {
    it('returns a positive value for contemporary dates', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        expect(getAyanamsa(date, AYANAMSA_TYPE.YUKTESHWAR)).toBeGreaterThan(0);
    });
});

// ============================================================================
// getAyanamsa — JN_BHASIN
// ============================================================================

describe('getAyanamsa — JN_BHASIN', () => {
    it('returns approximately 0.04° less than Lahiri', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const lahiri = getAyanamsa(date, AYANAMSA_TYPE.LAHIRI);
        const bhasin = getAyanamsa(date, AYANAMSA_TYPE.JN_BHASIN);
        expect(lahiri - bhasin).toBeCloseTo(0.0417, 3);
    });
});

// ============================================================================
// getAyanamsa — unknown type falls back to Lahiri
// ============================================================================

describe('getAyanamsa — fallback', () => {
    it('returns Lahiri value for unknown ayanamsa type', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        expect(getAyanamsa(date, 999)).toBeCloseTo(getAyanamsa(date, AYANAMSA_TYPE.LAHIRI), 10);
    });
});

// ============================================================================
// toSidereal
// ============================================================================

describe('toSidereal', () => {
    it('subtracts ayanamsa from tropical longitude', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        // Lahiri ~24.189° for this date
        const result = toSidereal(280, date, AYANAMSA_TYPE.LAHIRI);
        const ayanamsa = getAyanamsa(date, AYANAMSA_TYPE.LAHIRI);
        expect(result).toBeCloseTo(((280 - ayanamsa) % 360 + 360) % 360, 4);
    });

    it('returns value in [0, 360) for tropical 280° with Lahiri ~24.2°', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const result = toSidereal(280, date, AYANAMSA_TYPE.LAHIRI);
        // 280 - 24.189 ≈ 255.81
        expect(result).toBeGreaterThan(255);
        expect(result).toBeLessThan(256.5);
    });

    it('uses Lahiri as default when no ayanamsa type given', () => {
        const date = new Date('2024-06-01T00:00:00Z');
        expect(toSidereal(100, date)).toBeCloseTo(toSidereal(100, date, AYANAMSA_TYPE.LAHIRI), 10);
    });

    it('handles wrap-around: low tropical near 0° with ayanamsa ~24°', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        // Tropical 10° - ~24.189° would be negative → must wrap to ~345.8°
        const result = toSidereal(10, date, AYANAMSA_TYPE.LAHIRI);
        expect(result).toBeGreaterThan(340);
        expect(result).toBeLessThan(360);
    });

    it('KP gives slightly higher sidereal longitude than Lahiri (less subtraction)', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        const lahiriSid = toSidereal(280, date, AYANAMSA_TYPE.LAHIRI);
        const kpSid = toSidereal(280, date, AYANAMSA_TYPE.KRISHNAMURTI);
        // KP ayanamsa < Lahiri → kpSid > lahiriSid
        expect(kpSid).toBeGreaterThan(lahiriSid);
    });
});

// ============================================================================
// AYANAMSA_TYPE constants
// ============================================================================

describe('AYANAMSA_TYPE', () => {
    it('has the expected numeric values matching Swiss Ephemeris constants', () => {
        expect(AYANAMSA_TYPE.LAHIRI).toBe(1);
        expect(AYANAMSA_TYPE.RAMAN).toBe(3);
        expect(AYANAMSA_TYPE.KRISHNAMURTI).toBe(5);
        expect(AYANAMSA_TYPE.YUKTESHWAR).toBe(7);
        expect(AYANAMSA_TYPE.JN_BHASIN).toBe(8);
    });
});
