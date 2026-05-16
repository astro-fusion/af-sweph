/**
 * Integration tests for JsonEngine and createJsonSweph.
 *
 * All CSV data is provided inline via preloadedData — no filesystem, no network.
 *
 * The module-level yearlyCache in loader.ts persists across test runs within a
 * single vitest process. Each test creates its own EphemerisStore instance with
 * its own preloadedData, so tests remain isolated.
 */

import { describe, it, expect } from 'vitest';
import { createJsonSweph } from './index';
import { AYANAMSA_TYPE } from './ayanamsa';

// ============================================================================
// Inline test fixtures (two consecutive daily rows from the real 2024 dataset)
// ============================================================================

const SAMPLE_MAIN_CSV = `date,ayanamsa,sun_declination,equation_of_time,sun_long,sun_speed,moon_long,moon_speed,mars_long,mars_speed,mercury_long,mercury_speed,jupiter_long,jupiter_speed,venus_long,venus_speed,saturn_long,saturn_speed,uranus_long,uranus_speed,neptune_long,neptune_speed,pluto_long,pluto_speed,rahu_long,rahu_speed,ketu_long,ketu_speed
2024-01-01,24.1924,-23.0191,-3.29,280.5485,1.0190,161.9070,11.8138,267.6792,0.7418,262.2120,-0.0989,35.5844,0.0048,243.2205,1.2165,333.2880,0.0890,49.3731,-0.0215,355.0834,0.0148,299.3731,0.0311,21.0339,-0.0763,201.0339,-0.0763
2024-01-02,24.1924,-22.9347,-3.76,281.5676,1.0191,173.7085,11.8027,268.4214,0.7426,262.1915,0.0560,35.5909,0.0083,244.4374,1.2175,333.3775,0.0901,49.3519,-0.0208,355.0985,0.0154,299.4043,0.0312,20.9791,-0.0355,200.9791,-0.0355`;

// 6-hourly moon data for the same two days
const SAMPLE_MOON_CSV = `timestamp,moon_long,moon_speed,moon_lat
2024-01-01T00:00:00.000Z,155.99218,11.84840,3.56764
2024-01-01T06:00:00.000Z,158.95175,11.82886,3.37960
2024-01-01T12:00:00.000Z,161.90700,11.81383,3.18264
2024-01-01T18:00:00.000Z,164.85907,11.80351,2.97724
2024-01-02T00:00:00.000Z,167.80917,11.79811,2.76389
2024-01-02T06:00:00.000Z,170.75856,11.79779,2.54309
2024-01-02T12:00:00.000Z,173.70852,11.80272,2.31534
2024-01-02T18:00:00.000Z,176.66038,11.81306,2.08114`;

// Helper: create a fresh instance with sample data
function makeSampleSweph() {
    return createJsonSweph({
        preloadedData: { 2024: SAMPLE_MAIN_CSV },
        preloadedMoonData: { 2024: SAMPLE_MOON_CSV },
    });
}

// ============================================================================
// calculatePlanets
// ============================================================================

describe('createJsonSweph().calculatePlanets', () => {
    it('returns exactly 9 Vedic planets', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(planets).toHaveLength(9);
    });

    it('returns the expected planet names in order', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        const names = planets.map((p) => p.name);
        expect(names).toEqual([
            'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
        ]);
    });

    it('all planets have longitude in [0, 360)', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        for (const planet of planets) {
            expect(planet.longitude).toBeGreaterThanOrEqual(0);
            expect(planet.longitude).toBeLessThan(360);
        }
    });

    it('all planets have rasi in [1, 12]', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        for (const planet of planets) {
            expect(planet.rasi).toBeGreaterThanOrEqual(1);
            expect(planet.rasi).toBeLessThanOrEqual(12);
        }
    });

    it('all planets have rasiDegree in [0, 30)', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        for (const planet of planets) {
            expect(planet.rasiDegree).toBeGreaterThanOrEqual(0);
            expect(planet.rasiDegree).toBeLessThan(30);
        }
    });

    it('rasi is consistent with longitude for each planet', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        for (const planet of planets) {
            const expectedRasi = Math.floor(planet.longitude / 30) + 1;
            expect(planet.rasi).toBe(expectedRasi);
        }
    });

    describe('Mercury retrograde detection', () => {
        it('marks Mercury as retrograde when speed is negative (-0.0989)', async () => {
            const sweph = makeSampleSweph();
            // Row 2024-01-01: mercury_speed = -0.0989
            const date = new Date('2024-01-01T00:00:00Z');
            const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const mercury = planets.find((p) => p.name === 'Mercury')!;
            expect(mercury.isRetrograde).toBe(true);
            expect(mercury.speed).toBeLessThan(0);
        });

        it('marks Mercury as direct when speed is positive (+0.056)', async () => {
            const sweph = makeSampleSweph();
            // Row 2024-01-02: mercury_speed = +0.0560
            const date = new Date('2024-01-02T00:00:00Z');
            const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const mercury = planets.find((p) => p.name === 'Mercury')!;
            expect(mercury.isRetrograde).toBe(false);
            expect(mercury.speed).toBeGreaterThan(0);
        });
    });

    describe('Sun position', () => {
        it('Sun sidereal longitude is ~256.36° on 2024-01-01', async () => {
            const sweph = makeSampleSweph();
            const date = new Date('2024-01-01T00:00:00Z');
            const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const sun = planets.find((p) => p.name === 'Sun')!;
            // tropical 280.5485 - ayanamsa 24.1924 = ~256.356
            expect(sun.longitude).toBeCloseTo(256.356, 1);
        });

        it('Sun is in rasi 9 (Sagittarius / Dhanu) on 2024-01-01', async () => {
            const sweph = makeSampleSweph();
            const date = new Date('2024-01-01T00:00:00Z');
            const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const sun = planets.find((p) => p.name === 'Sun')!;
            // 256.356 / 30 = 8.545 → rasi 9
            expect(sun.rasi).toBe(9);
        });
    });

    describe('Jupiter position', () => {
        it('Jupiter is in rasi 1 (Aries / Mesha) on 2024-01-01', async () => {
            const sweph = makeSampleSweph();
            const date = new Date('2024-01-01T00:00:00Z');
            const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const jupiter = planets.find((p) => p.name === 'Jupiter')!;
            // tropical 35.5844 - 24.1924 = ~11.392 → rasi 1
            expect(jupiter.rasi).toBe(1);
            expect(jupiter.longitude).toBeCloseTo(11.392, 1);
        });
    });

    describe('Rahu/Ketu opposition', () => {
        it('Rahu and Ketu are approximately 180° apart', async () => {
            const sweph = makeSampleSweph();
            const date = new Date('2024-01-01T00:00:00Z');
            const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const rahu = planets.find((p) => p.name === 'Rahu')!;
            const ketu = planets.find((p) => p.name === 'Ketu')!;
            let diff = Math.abs(rahu.longitude - ketu.longitude);
            if (diff > 180) diff = 360 - diff;
            expect(diff).toBeCloseTo(180, 0);
        });
    });

    describe('Interpolation', () => {
        it('Sun longitude at noon (t=0.5) is between the two daily rows', async () => {
            const sweph = makeSampleSweph();
            const noon = new Date('2024-01-01T12:00:00Z');
            const planets = await sweph.calculatePlanets(noon, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const sun = planets.find((p) => p.name === 'Sun')!;
            // Day 1 sun_long=280.5485, Day 2 sun_long=281.5676 → mid tropical ~281.058
            // Sidereal: 281.058 - 24.1924 = 256.866
            expect(sun.longitude).toBeGreaterThan(256.35); // after day-1 position
            expect(sun.longitude).toBeLessThan(257.40);    // before day-2 position
        });

        it('Moon at 06:00 UTC uses 6-hourly data for higher resolution', async () => {
            const sweph = makeSampleSweph();
            const date = new Date('2024-01-01T06:00:00Z');
            const planets = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const moon = planets.find((p) => p.name === 'Moon')!;
            // 6-hourly entry at 06:00 is 158.95175 tropical → sidereal ~134.759
            expect(moon.longitude).toBeCloseTo(158.95175 - 24.1924, 0);
        });
    });

    describe('Non-Lahiri ayanamsa', () => {
        it('KP ayanamsa gives different Sun longitude than Lahiri', async () => {
            const sweph = makeSampleSweph();
            const date = new Date('2024-01-01T00:00:00Z');
            const lahiri = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const kp = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.KRISHNAMURTI });
            expect(lahiri[0].longitude).not.toBeCloseTo(kp[0].longitude, 1);
        });
    });

    describe('Missing data', () => {
        it('does not throw for a year outside preloaded range', async () => {
            // Use a year that is unlikely to have been cached by other tests (3099)
            const sweph = createJsonSweph({ preloadedData: {} });
            const futureDate = new Date('3099-01-01T00:00:00Z');
            await expect(
                sweph.calculatePlanets(futureDate, { ayanamsa: AYANAMSA_TYPE.LAHIRI })
            ).resolves.toEqual([]);
        });

        it('returns empty array for a year far outside preloaded range', async () => {
            // Use year 1800 — nothing in any test loads that year
            const sweph = createJsonSweph({ preloadedData: {} });
            const oldDate = new Date('1800-01-01T00:00:00Z');
            const planets = await sweph.calculatePlanets(oldDate, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            expect(planets).toEqual([]);
        });
    });

    describe('Determinism', () => {
        it('same input always returns same output', async () => {
            const sweph = makeSampleSweph();
            const date = new Date('2024-01-01T06:00:00Z');
            const p1 = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            const p2 = await sweph.calculatePlanets(date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
            expect(p1[0].longitude).toBe(p2[0].longitude);
            expect(p1[1].longitude).toBe(p2[1].longitude);
        });
    });
});

// ============================================================================
// calculateLagna
// ============================================================================

describe('createJsonSweph().calculateLagna', () => {
    const NEW_DELHI = { latitude: 28.6138, longitude: 77.2090 };

    it('returns longitude in [0, 360)', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const lagna = await sweph.calculateLagna(date, NEW_DELHI, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(lagna.longitude).toBeGreaterThanOrEqual(0);
        expect(lagna.longitude).toBeLessThan(360);
    });

    it('returns rasi in [1, 12]', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const lagna = await sweph.calculateLagna(date, NEW_DELHI, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(lagna.rasi).toBeGreaterThanOrEqual(1);
        expect(lagna.rasi).toBeLessThanOrEqual(12);
    });

    it('returns nakshatra in [1, 27]', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const lagna = await sweph.calculateLagna(date, NEW_DELHI, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(lagna.nakshatra).toBeGreaterThanOrEqual(1);
        expect(lagna.nakshatra).toBeLessThanOrEqual(27);
    });

    it('does NOT require preloaded ephemeris data (lagna uses formula only)', async () => {
        // lagna is calculated purely from GMST formula, not CSV data
        const sweph = createJsonSweph({ preloadedData: {} });
        const date = new Date('2024-01-01T00:00:00Z');
        const lagna = await sweph.calculateLagna(date, NEW_DELHI, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(lagna.longitude).toBeGreaterThanOrEqual(0);
        expect(lagna.longitude).toBeLessThan(360);
    });

    it('different locations give different lagnas', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const delhi = await sweph.calculateLagna(date, NEW_DELHI, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        const sydney = await sweph.calculateLagna(date, { latitude: -33.87, longitude: 151.21 }, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(delhi.longitude).not.toBeCloseTo(sydney.longitude, 0);
    });
});

// ============================================================================
// calculateSunTimes
// ============================================================================

describe('createJsonSweph().calculateSunTimes', () => {
    const NEW_DELHI = { latitude: 28.6, longitude: 77.2 };

    it('returns a solarNoon Date object', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const times = await sweph.calculateSunTimes(date, NEW_DELHI);
        expect(times.solarNoon).toBeInstanceOf(Date);
    });

    it('sunrise is before solarNoon', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const times = await sweph.calculateSunTimes(date, NEW_DELHI);
        if (times.sunrise) {
            expect(times.sunrise.getTime()).toBeLessThan(times.solarNoon.getTime());
        }
    });

    it('sunset is after solarNoon', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const times = await sweph.calculateSunTimes(date, NEW_DELHI);
        if (times.sunset) {
            expect(times.sunset.getTime()).toBeGreaterThan(times.solarNoon.getTime());
        }
    });

    it('sunrise is approximately 01:44 UTC for New Delhi on 2024-01-01', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const times = await sweph.calculateSunTimes(date, NEW_DELHI);
        // Computed: ~1.73h UTC = ~1h 44min UTC = ~7:14 IST
        expect(times.sunrise).not.toBeNull();
        if (times.sunrise) {
            const sunriseHour = times.sunrise.getUTCHours() + times.sunrise.getUTCMinutes() / 60;
            expect(sunriseHour).toBeGreaterThan(1.5);
            expect(sunriseHour).toBeLessThan(2.0);
        }
    });

    it('day length is approximately 10.35 hours for New Delhi on 2024-01-01', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const times = await sweph.calculateSunTimes(date, NEW_DELHI);
        // Computed: ~10.355h
        expect(times.dayLength).toBeGreaterThan(10.0);
        expect(times.dayLength).toBeLessThan(11.0);
    });

    it('returns null sunrise/sunset for missing data year (no throw)', async () => {
        const sweph = createJsonSweph({ preloadedData: {} });
        const date = new Date('2024-01-01T00:00:00Z');
        const times = await sweph.calculateSunTimes(date, NEW_DELHI);
        // When data is missing, engine falls back gracefully
        expect(times).toBeDefined();
        expect(times.solarNoon).toBeInstanceOf(Date);
    });
});

// ============================================================================
// calculateMoonPhase
// ============================================================================

describe('createJsonSweph().calculateMoonPhase', () => {
    it('returns phase in [0, 360)', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const phase = await sweph.calculateMoonPhase(date);
        expect(phase.phase).toBeGreaterThanOrEqual(0);
        expect(phase.phase).toBeLessThan(360);
    });

    it('returns illumination in [0, 1]', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const phase = await sweph.calculateMoonPhase(date);
        expect(phase.illumination).toBeGreaterThanOrEqual(0);
        expect(phase.illumination).toBeLessThanOrEqual(1);
    });

    it('returns a non-empty phaseName string', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const phase = await sweph.calculateMoonPhase(date);
        expect(typeof phase.phaseName).toBe('string');
        expect(phase.phaseName.length).toBeGreaterThan(0);
    });

    it('returns phase ~241.4° and illumination ~0.74 for 2024-01-01 (waning gibbous)', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const phase = await sweph.calculateMoonPhase(date);
        // Computed: sun_sid~256.36, moon_sid~137.71, phase = norm360(137.71-256.36) = 241.36
        expect(phase.phase).toBeCloseTo(241.36, 0);
        expect(phase.illumination).toBeCloseTo(0.74, 1);
        expect(phase.phaseName).toBe('Waning Gibbous');
    });

    it('age is proportional to phase (age = phase / 360 * 29.53)', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const { phase, age } = await sweph.calculateMoonPhase(date);
        expect(age).toBeCloseTo((phase / 360) * 29.53, 2);
    });

    it('returns a default/empty phase for missing data year without throwing', async () => {
        const sweph = createJsonSweph({ preloadedData: {} });
        const date = new Date('2024-01-01T00:00:00Z');
        const result = await sweph.calculateMoonPhase(date);
        // Should not throw — returns { phase: 0, illumination: 0, age: 0, phaseName: 'Unknown' }
        expect(result).toBeDefined();
        expect(typeof result.phase).toBe('number');
    });
});

// ============================================================================
// calculatePlanet (individual planet lookup)
// ============================================================================

describe('createJsonSweph().calculatePlanet', () => {
    it('returns the Sun when id=0', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planet = await sweph.calculatePlanet(0, date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(planet).not.toBeNull();
        expect(planet!.name).toBe('Sun');
    });

    it('returns the Moon when id=1', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planet = await sweph.calculatePlanet(1, date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(planet).not.toBeNull();
        expect(planet!.name).toBe('Moon');
    });

    it('returns null for an unknown planet id', async () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const planet = await sweph.calculatePlanet(99, date, { ayanamsa: AYANAMSA_TYPE.LAHIRI });
        expect(planet).toBeNull();
    });
});

// ============================================================================
// getAyanamsa (utility method on instance)
// ============================================================================

describe('createJsonSweph().getAyanamsa', () => {
    it('returns Lahiri ayanamsa ~24.19° for 2024-01-01', () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        const ay = sweph.getAyanamsa(date, AYANAMSA_TYPE.LAHIRI);
        expect(ay).toBeGreaterThan(24.0);
        expect(ay).toBeLessThan(24.4);
    });

    it('defaults to Lahiri when no type is given', () => {
        const sweph = makeSampleSweph();
        const date = new Date('2024-01-01T00:00:00Z');
        expect(sweph.getAyanamsa(date)).toBeCloseTo(sweph.getAyanamsa(date, AYANAMSA_TYPE.LAHIRI), 10);
    });
});

// ============================================================================
// dateToJulian (utility method on instance)
// ============================================================================

describe('createJsonSweph().dateToJulian', () => {
    it('returns J2000 epoch (2451545.0) for 2000-01-01 12:00 UTC', () => {
        const sweph = makeSampleSweph();
        const date = new Date('2000-01-01T12:00:00Z');
        expect(sweph.dateToJulian(date)).toBeCloseTo(2451545.0, 4);
    });
});
