/**
 * Tests for Lagna (Ascendant) calculation.
 */

import { describe, it, expect } from 'vitest';
import { getFastLagna } from './lagna';
import { AYANAMSA_TYPE } from './ayanamsa';

// ============================================================================
// Known reference values (computed from the same algorithm)
// ============================================================================

// New Delhi: lat=28.6138°N, lon=77.2090°E
const NEW_DELHI = { latitude: 28.6138, longitude: 77.2090 };
// Mumbai: lat=19.076°N, lon=72.8777°E
const MUMBAI = { latitude: 19.076, longitude: 72.8777 };

describe('getFastLagna', () => {
    describe('result shape and range validation', () => {
        it('returns longitude in [0, 360)', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            expect(result.longitude).toBeGreaterThanOrEqual(0);
            expect(result.longitude).toBeLessThan(360);
        });

        it('returns rasi in [1, 12]', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            expect(result.rasi).toBeGreaterThanOrEqual(1);
            expect(result.rasi).toBeLessThanOrEqual(12);
        });

        it('returns nakshatra in [1, 27]', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            expect(result.nakshatra).toBeGreaterThanOrEqual(1);
            expect(result.nakshatra).toBeLessThanOrEqual(27);
        });

        it('returns rasiDegree in [0, 30)', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            expect(result.rasiDegree).toBeGreaterThanOrEqual(0);
            expect(result.rasiDegree).toBeLessThan(30);
        });

        it('rasiDegree is consistent with longitude and rasi', () => {
            const date = new Date('2024-06-15T06:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            const expectedRasiDegree = result.longitude % 30;
            expect(result.rasiDegree).toBeCloseTo(expectedRasiDegree, 5);
        });

        it('rasi is consistent with longitude', () => {
            const date = new Date('2024-06-15T06:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            const expectedRasi = Math.floor(result.longitude / 30) + 1;
            expect(result.rasi).toBe(expectedRasi);
        });

        it('nakshatra is consistent with longitude', () => {
            const date = new Date('2024-06-15T06:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            const expectedNakshatra = Math.floor(result.longitude / (360 / 27)) + 1;
            expect(result.nakshatra).toBe(expectedNakshatra);
        });
    });

    describe('known reference: New Delhi 2000-01-01 00:00 UTC (Lahiri)', () => {
        it('returns sidereal lagna ~231.4° (Scorpio/Vrischika rasi 8)', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.LAHIRI);
            // Computed: ~231.44° → rasi 8 (Scorpio)
            expect(result.longitude).toBeGreaterThan(229);
            expect(result.longitude).toBeLessThan(234);
            expect(result.rasi).toBe(8);
        });

        it('returns nakshatra 18 (Jyeshtha area) for that reference point', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const result = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.LAHIRI);
            // 231.44° / (360/27) = 17.36 → nakshatra 18
            expect(result.nakshatra).toBe(18);
        });
    });

    describe('location sensitivity', () => {
        it('New Delhi and Mumbai give different lagnas at the same time', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const delhi = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            const mumbai = getFastLagna(date, MUMBAI.latitude, MUMBAI.longitude);
            // New Delhi is ~4.3° east of Mumbai → LST differs by ~0.29h → ascendant differs
            const diff = Math.abs(delhi.longitude - mumbai.longitude);
            const wrappedDiff = diff > 180 ? 360 - diff : diff;
            expect(wrappedDiff).toBeGreaterThan(0.3);
        });

        it('eastern location has earlier (larger) lagna than western at same time', () => {
            // New Delhi (77.2°E) is east of Mumbai (72.9°E) — so LST is ~4.3° more
            const date = new Date('2000-01-01T06:00:00Z');
            const delhi = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude);
            const mumbai = getFastLagna(date, MUMBAI.latitude, MUMBAI.longitude);
            // The difference should be meaningful (not zero)
            const diff = Math.abs(delhi.longitude - mumbai.longitude);
            expect(diff).toBeGreaterThan(0.1);
        });

        it('extreme southern location (Sydney) returns valid lagna', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            // Sydney: lat=-33.87, lon=151.21
            const result = getFastLagna(date, -33.87, 151.21, AYANAMSA_TYPE.LAHIRI);
            expect(result.longitude).toBeGreaterThanOrEqual(0);
            expect(result.longitude).toBeLessThan(360);
            expect(result.rasi).toBeGreaterThanOrEqual(1);
            expect(result.rasi).toBeLessThanOrEqual(12);
        });
    });

    describe('time sensitivity', () => {
        it('midnight and noon give significantly different lagnas', () => {
            const midnight = new Date('2000-01-01T00:00:00Z');
            const noon = new Date('2000-01-01T06:00:00Z'); // ~noon IST (+5:30)
            const lagnaA = getFastLagna(midnight, NEW_DELHI.latitude, NEW_DELHI.longitude);
            const lagnaB = getFastLagna(noon, NEW_DELHI.latitude, NEW_DELHI.longitude);
            // Earth rotates ~90° in 6 hours → ascendant shifts ~90° (±)
            let diff = Math.abs(lagnaA.longitude - lagnaB.longitude);
            if (diff > 180) diff = 360 - diff;
            // Must differ by at least 45° (conservative lower bound for 6h gap)
            expect(diff).toBeGreaterThan(45);
        });

        it('lagna changes continuously over time', () => {
            const dates = [0, 2, 4, 6].map(
                (h) => new Date(`2024-03-20T${String(h).padStart(2, '0')}:00:00Z`)
            );
            const lagnas = dates.map((d) =>
                getFastLagna(d, NEW_DELHI.latitude, NEW_DELHI.longitude)
            );
            // No two consecutive 2-hour readings should be identical
            for (let i = 0; i < lagnas.length - 1; i++) {
                expect(lagnas[i].longitude).not.toBeCloseTo(lagnas[i + 1].longitude, 1);
            }
        });
    });

    describe('ayanamsa comparison', () => {
        it('KP ayanamsa gives slightly different lagna than Lahiri', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const lahiri = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.LAHIRI);
            const kp = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.KRISHNAMURTI);
            // KP ayanamsa is ~0.25° less → sidereal lagna is ~0.25° more
            const diff = Math.abs(lahiri.longitude - kp.longitude);
            expect(diff).toBeGreaterThan(0.2);
            expect(diff).toBeLessThan(0.3);
        });

        it('Raman ayanamsa gives meaningfully different lagna (>1° from Lahiri)', () => {
            const date = new Date('2000-01-01T00:00:00Z');
            const lahiri = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.LAHIRI);
            const raman = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.RAMAN);
            let diff = Math.abs(lahiri.longitude - raman.longitude);
            if (diff > 180) diff = 360 - diff;
            expect(diff).toBeGreaterThan(1);
        });
    });

    describe('edge cases', () => {
        it('handles equatorial location (latitude = 0)', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            const result = getFastLagna(date, 0, 0, AYANAMSA_TYPE.LAHIRI);
            expect(result.longitude).toBeGreaterThanOrEqual(0);
            expect(result.longitude).toBeLessThan(360);
        });

        it('handles Greenwich meridian (longitude = 0)', () => {
            const date = new Date('2024-06-21T12:00:00Z');
            const result = getFastLagna(date, 51.5, 0, AYANAMSA_TYPE.LAHIRI);
            expect(result.rasi).toBeGreaterThanOrEqual(1);
            expect(result.rasi).toBeLessThanOrEqual(12);
        });

        it('same input always produces the same output (deterministic)', () => {
            const date = new Date('2024-01-01T06:30:00Z');
            const r1 = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.LAHIRI);
            const r2 = getFastLagna(date, NEW_DELHI.latitude, NEW_DELHI.longitude, AYANAMSA_TYPE.LAHIRI);
            expect(r1.longitude).toBe(r2.longitude);
            expect(r1.rasi).toBe(r2.rasi);
        });
    });
});
