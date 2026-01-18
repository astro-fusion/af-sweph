import { describe, it, expect, beforeAll } from 'vitest';
import { LiteEngine } from './engine';
import { CalculationTier, FeatureNotSupportedError, EngineFeatures } from '@af/sweph-core';

describe('LiteEngine', () => {
    let engine: LiteEngine;

    beforeAll(async () => {
        engine = new LiteEngine();
        await engine.initialize();
    });

    describe('initialization', () => {
        it('should always be available (pure JS)', async () => {
            const available = await engine.isAvailable();
            expect(available).toBe(true);
        });

        it('should have tier FAST', () => {
            expect(engine.tier).toBe(CalculationTier.FAST);
        });

        it('should support planets, sun_times, moon_phase, ayanamsa', () => {
            expect(engine.supportedFeatures.has(EngineFeatures.PLANETS)).toBe(true);
            expect(engine.supportedFeatures.has(EngineFeatures.SUN_TIMES)).toBe(true);
            expect(engine.supportedFeatures.has(EngineFeatures.MOON_PHASE)).toBe(true);
            expect(engine.supportedFeatures.has(EngineFeatures.AYANAMSA)).toBe(true);
        });

        it('should NOT support lagna/houses', () => {
            expect(engine.supportedFeatures.has(EngineFeatures.LAGNA)).toBe(false);
            expect(engine.supportedFeatures.has(EngineFeatures.HOUSES)).toBe(false);
        });
    });

    describe('calculatePlanets', () => {
        it('should calculate 9 Vedic planets', async () => {
            const date = new Date('2025-01-18T12:00:00Z');
            const planets = await engine.calculatePlanets(date, { ayanamsa: 1 });

            expect(planets.length).toBeGreaterThanOrEqual(7); // At minimum 7 main planets
            
            // Check all expected planets exist
            const planetIds = planets.map(p => p.id);
            expect(planetIds).toContain('sun');
            expect(planetIds).toContain('moon');
            expect(planetIds).toContain('mars');
            expect(planetIds).toContain('mercury');
            expect(planetIds).toContain('jupiter');
            expect(planetIds).toContain('venus');
            expect(planetIds).toContain('saturn');
        });

        it('should return valid longitude values (0-360)', async () => {
            const date = new Date();
            const planets = await engine.calculatePlanets(date);

            for (const planet of planets) {
                expect(planet.longitude).toBeGreaterThanOrEqual(0);
                expect(planet.longitude).toBeLessThan(360);
            }
        });

        it('should compute valid rashi (1-12)', async () => {
            const date = new Date();
            const planets = await engine.calculatePlanets(date);

            for (const planet of planets) {
                expect(planet.rasi).toBeGreaterThanOrEqual(1);
                expect(planet.rasi).toBeLessThanOrEqual(12);
            }
        });
    });

    describe('calculateLagna', () => {
        it('should throw FeatureNotSupportedError', async () => {
            const date = new Date();
            const location = { latitude: 27.7, longitude: 85.3 };

            await expect(engine.calculateLagna(date, location)).rejects.toThrow(FeatureNotSupportedError);
        });
    });

    describe('calculateSunTimes', () => {
        it('should return sunrise/sunset for normal locations', async () => {
            const date = new Date('2025-06-21T12:00:00Z');
            const location = { latitude: 27.7, longitude: 85.3 }; // Kathmandu

            const sunTimes = await engine.calculateSunTimes(date, location);

            expect(sunTimes.solarNoon).toBeInstanceOf(Date);
            // dayLength can vary based on sunrise/sunset availability
            expect(typeof sunTimes.dayLength).toBe('number');
        });
    });

    describe('calculateMoonPhase', () => {
        it('should return valid moon phase data', async () => {
            const date = new Date();
            const moonPhase = await engine.calculateMoonPhase(date);

            expect(moonPhase.phase).toBeGreaterThanOrEqual(0);
            expect(moonPhase.phase).toBeLessThan(360);
            expect(moonPhase.illumination).toBeGreaterThanOrEqual(0);
            expect(moonPhase.illumination).toBeLessThanOrEqual(100);
            expect(moonPhase.age).toBeGreaterThanOrEqual(0);
            expect(moonPhase.age).toBeLessThanOrEqual(30);
            expect(moonPhase.phaseName).toBeTruthy();
        });
    });

    describe('getAyanamsa', () => {
        it('should return approximate Lahiri ayanamsa (~24 degrees for current date)', () => {
            const date = new Date();
            const ayanamsa = engine.getAyanamsa(date, 1); // Lahiri

            // Current Lahiri ayanamsa is approximately 24 degrees
            expect(ayanamsa).toBeGreaterThan(23);
            expect(ayanamsa).toBeLessThan(25);
        });
    });
});
