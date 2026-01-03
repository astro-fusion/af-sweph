/**
 * v2 API Tests
 * 
 * Comprehensive test suite for the modern @af/sweph v2 API.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createSweph,
  PLANETS,
  AYANAMSA,
  RASHIS,
  NAKSHATRAS,
  type SwephInstance,
} from './index';

describe('@af/sweph v2 API', () => {
  let sweph: SwephInstance;

  beforeAll(async () => {
    sweph = await createSweph();
  });

  describe('createSweph', () => {
    it('should create a SwephInstance', async () => {
      const instance = await createSweph();
      expect(instance).toBeDefined();
      expect(instance.calculatePlanets).toBeInstanceOf(Function);
      expect(instance.calculateLagna).toBeInstanceOf(Function);
    });

    it('should expose constants', async () => {
      const instance = await createSweph();
      expect(instance.PLANETS).toBeDefined();
      expect(instance.AYANAMSA).toBeDefined();
      expect(instance.RASHIS).toBeDefined();
      expect(instance.NAKSHATRAS).toBeDefined();
    });

    it('should accept initialization options', async () => {
      const instance = await createSweph({
        preWarm: true,
      });
      expect(instance).toBeDefined();
    });
  });

  describe('calculatePlanets', () => {
    it('should calculate all 9 Vedic planets', async () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 });

      expect(planets).toBeInstanceOf(Array);
      expect(planets.length).toBe(9); // Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu
    });

    it('should return valid longitude values (0-360)', async () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 });

      for (const planet of planets) {
        expect(planet.longitude).toBeGreaterThanOrEqual(0);
        expect(planet.longitude).toBeLessThan(360);
      }
    });

    it('should return valid rasi values (1-12)', async () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 });

      for (const planet of planets) {
        expect(planet.rasi).toBeGreaterThanOrEqual(1);
        expect(planet.rasi).toBeLessThanOrEqual(12);
      }
    });

    it('should support different ayanamsas', async () => {
      const date = new Date('2024-01-01T12:00:00Z');
      
      const lahiri = await sweph.calculatePlanets(date, { ayanamsa: 1 });
      const raman = await sweph.calculatePlanets(date, { ayanamsa: 3 });

      // Different ayanamsas should give different longitudes (small difference)
      expect(lahiri[0].longitude).not.toBe(raman[0].longitude);
    });
  });

  describe('calculatePlanet', () => {
    it('should calculate Sun position', async () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const sun = await sweph.calculatePlanet(0, date, { ayanamsa: 1 });

      expect(sun).toBeDefined();
      expect(sun!.longitude).toBeGreaterThanOrEqual(0);
      expect(sun!.longitude).toBeLessThan(360);
    });

    it('should calculate Moon position', async () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const moon = await sweph.calculatePlanet(1, date, { ayanamsa: 1 });

      expect(moon).toBeDefined();
      expect(moon!.longitude).toBeGreaterThanOrEqual(0);
      expect(moon!.longitude).toBeLessThan(360);
    });
  });

  describe('calculateLagna', () => {
    it('should calculate ascendant', async () => {
      const date = new Date('2024-01-01T06:00:00Z');
      const location = { latitude: 27.7, longitude: 85.3, timezone: 5.75 };
      
      const lagna = await sweph.calculateLagna(date, location, { ayanamsa: 1 });

      expect(lagna).toBeDefined();
      expect(lagna.longitude).toBeGreaterThanOrEqual(0);
      expect(lagna.longitude).toBeLessThan(360);
      expect(lagna.rasi).toBeGreaterThanOrEqual(1);
      expect(lagna.rasi).toBeLessThanOrEqual(12);
    });

    it('should return 12 house cusps', async () => {
      const date = new Date('2024-01-01T06:00:00Z');
      const location = { latitude: 27.7, longitude: 85.3 };
      
      const lagna = await sweph.calculateLagna(date, location, { ayanamsa: 1 });

      expect(lagna.houses).toBeDefined();
      expect(lagna.houses.length).toBe(12);
    });
  });

  describe('calculateSunTimes', () => {
    it('should calculate sunrise and sunset', async () => {
      const date = new Date('2024-06-21T12:00:00Z'); // Summer solstice
      const location = { latitude: 27.7, longitude: 85.3, timezone: 5.75 };
      
      const sunTimes = await sweph.calculateSunTimes(date, location);

      expect(sunTimes).toBeDefined();
      // Sun times may be Date objects or timestamps
      expect(sunTimes.sunrise).toBeDefined();
      expect(sunTimes.sunset).toBeDefined();
    });
  });

  describe('calculateMoonPhase', () => {
    it('should calculate moon phase', async () => {
      const date = new Date('2024-01-11T00:00:00Z'); // Near new moon
      const phase = await sweph.calculateMoonPhase(date);

      expect(phase).toBeDefined();
      expect(phase.phaseName).toBeDefined();
      // Phase value may be in degrees (0-360) or normalized (0-1)
      expect(typeof phase.phase).toBe('number');
    });
  });

  describe('calculateNextMoonPhases', () => {
    it('should return next moon phases', async () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const phases = await sweph.calculateNextMoonPhases(date);

      expect(phases).toBeDefined();
      // At least one phase should be defined
      const hasPhase = phases.newMoon || phases.fullMoon || phases.firstQuarter || phases.lastQuarter;
      expect(hasPhase).toBeTruthy();
    });
  });

  describe('Utility methods', () => {
    it('should convert date to Julian Day', () => {
      const date = new Date('2000-01-01T12:00:00Z');
      const jd = sweph.dateToJulian(date);

      // JD for J2000.0 is 2451545.0
      expect(Math.abs(jd - 2451545.0)).toBeLessThan(0.01);
    });

    it('should get ayanamsa value', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const ayanamsa = sweph.getAyanamsa(date, 1); // Lahiri

      // Lahiri ayanamsa should be around 24 degrees in 2024
      expect(ayanamsa).toBeGreaterThan(23);
      expect(ayanamsa).toBeLessThan(25);
    });
  });

  describe('Constants', () => {
    it('should have planet definitions', () => {
      expect(PLANETS).toBeDefined();
      // PLANETS may be an object with id/name or just numeric IDs
      expect(Object.keys(PLANETS).length).toBeGreaterThan(0);
    });

    it('should have ayanamsa definitions', () => {
      expect(AYANAMSA).toBeDefined();
      expect(AYANAMSA.LAHIRI).toBeDefined();
    });

    it('should have rashi definitions', () => {
      expect(RASHIS).toBeDefined();
      expect(Object.keys(RASHIS).length).toBeGreaterThanOrEqual(12);
    });

    it('should have nakshatra definitions', () => {
      expect(NAKSHATRAS).toBeDefined();
      expect(Object.keys(NAKSHATRAS).length).toBeGreaterThanOrEqual(27);
    });
  });
});

describe('Known astronomical calculations', () => {
  let sweph: SwephInstance;

  beforeAll(async () => {
    sweph = await createSweph();
  });

  it('should show consistent results for same input', async () => {
    const date = new Date('2024-01-01T12:00:00Z');
    
    const planets1 = await sweph.calculatePlanets(date, { ayanamsa: 1 });
    const planets2 = await sweph.calculatePlanets(date, { ayanamsa: 1 });

    expect(planets1[0].longitude).toBe(planets2[0].longitude);
    expect(planets1[1].longitude).toBe(planets2[1].longitude);
  });

  it('should calculate different positions for different dates', async () => {
    const date1 = new Date('2024-01-01T12:00:00Z');
    const date2 = new Date('2024-06-01T12:00:00Z');
    
    const planets1 = await sweph.calculatePlanets(date1, { ayanamsa: 1 });
    const planets2 = await sweph.calculatePlanets(date2, { ayanamsa: 1 });

    // Sun should be in different positions 5 months apart
    expect(planets1[0].longitude).not.toBe(planets2[0].longitude);
  });
});
