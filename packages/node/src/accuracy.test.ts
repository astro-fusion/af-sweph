/**
 * Accuracy Tests for @af/sweph
 * 
 * Verifies calculation accuracy against known astronomical data for Kathmandu 1984.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { AYANAMSA, createSweph, type SwephInstance } from './index';

describe('@af/sweph Accuracy Verification', () => {
    let sweph: SwephInstance;

    // Kathmandu, Nepal: 1984-11-20 10:45:00 (+5:45 timezone)
    const TEST_DATE = new Date('1984-11-20T10:45:00+05:45');
    const TEST_LOCATION = { latitude: 27.7172, longitude: 85.324, timezone: 5.75 };

    beforeAll(async () => {
        sweph = await createSweph();
        // Force native for this test suite
        console.log(`[DEBUG] Ayanamsa for ${TEST_DATE.toISOString()}: ${sweph.getAyanamsa(TEST_DATE, 1).toFixed(4)}`);
    });

    describe('Planetary Positions (Lahiri Ayanamsa)', () => {
        it('should calculate accurate planetary longitudes', async () => {
            // Force NATIVE tier explicitly
            const planets = await sweph.calculatePlanets(TEST_DATE, {
                ayanamsa: AYANAMSA.LAHIRI,
                // @ts-ignore - internal option for AstroCalculator
                forceTier: 3 // CalculationTier.NATIVE
            });

            const findPlanet = (id: string) => planets.find(p => p.id === id);

            // Expected values (Verified for 10:45 Local Kathmandu / 05:00 UTC using NATIVE tier)
            const expectations = [
                { id: 'sun', expected: 214.4142 },
                { id: 'moon', expected: 176.8246 },
                { id: 'mars', expected: 279.6977 },
                { id: 'mercury', expected: 235.3348 },
                { id: 'jupiter', expected: 258.7016 },
                { id: 'venus', expected: 253.8278 },
                { id: 'saturn', expected: 206.4946 },
                { id: 'rahu', expected: 33.8051 },
                { id: 'ketu', expected: 213.8051 },
            ];

            for (const exp of expectations) {
                const planet = findPlanet(exp.id);
                expect(planet, `Planet ${exp.id} not found`).toBeDefined();

                // High precision check (0.1 degree)
                expect(planet!.longitude).toBeCloseTo(exp.expected, 1);
            }
        });

        it('should maintain Ketu exactly 180 degrees from Rahu', async () => {
            const planets = await sweph.calculatePlanets(TEST_DATE, {
                ayanamsa: AYANAMSA.LAHIRI,
                // @ts-ignore
                forceTier: 3
            });
            const rahu = planets.find(p => p.id === 'rahu');
            const ketu = planets.find(p => p.id === 'ketu');

            expect(rahu).toBeDefined();
            expect(ketu).toBeDefined();

            const diff = Math.abs(rahu!.longitude - ketu!.longitude);
            // Normalized angular difference should be 180
            const normDiff = diff % 360;
            const distTo180 = Math.abs(normDiff - 180);
            expect(distTo180).toBeLessThan(0.0001);
        });
    });

    describe('Lagna & Houses (Lahiri Ayanamsa)', () => {
        it('should calculate accurate sidereal Lagna (Ascendant)', async () => {
            const lagna = await sweph.calculateLagna(TEST_DATE, TEST_LOCATION, {
                ayanamsa: AYANAMSA.LAHIRI,
                // @ts-ignore
                forceTier: 3
            });

            // Expected Lagna for 1984-11-20 10:45 Kathmandu: Verified 272.4811
            expect(lagna.longitude).toBeCloseTo(272.4811, 1);
        });


        it('should return 12 house cusps', async () => {
            const lagna = await sweph.calculateLagna(TEST_DATE, TEST_LOCATION, {
                ayanamsa: AYANAMSA.LAHIRI,
                // @ts-ignore
                forceTier: 3
            });
            expect(lagna.houses).toBeDefined();
            expect(lagna.houses!.length).toBe(12);
        });
    });
});
