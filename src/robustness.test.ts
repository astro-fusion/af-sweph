import { describe, it, expect } from 'vitest';
import {
  PlanetId,
  calculatePlanets,
  calculateSunTimes,
  calculateSunPath,
  calculateMoonData,
  calculateMoonPhase,
  calculateNextMoonPhases,
  calculatePlanetRiseSetTimes
} from './index';

describe('SWEPH Robustness Tests', () => {
  const testDate = new Date('2025-01-01T12:00:00Z');
  // Kathmandu, Nepal
  const location = {
    latitude: 27.7172,
    longitude: 85.3240,
    height: 1400
  };
  const timeZoneOffset = 5.75; // UTC+5:45

  // Common location options for reuse across tests
  const locationOptions = {
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: timeZoneOffset
  };

  it('should initialize library successfully', () => {
    // Test that we can call a basic calculation function
    const planets = calculatePlanets(testDate);
    expect(planets).toBeDefined();
    expect(Array.isArray(planets)).toBe(true);
  });

  describe('Sun Calculations', () => {
    it('should calculate sun times without error', async () => {
      const result = await calculateSunTimes(testDate, locationOptions);

      expect(result).toBeDefined();
      expect(result.sunrise).toBeInstanceOf(Date);
      expect(result.sunset).toBeInstanceOf(Date);
      expect(result.solarNoon).toBeInstanceOf(Date);
      expect(typeof result.dayLength).toBe('number');
      expect(result.dayLength).toBeGreaterThan(0);
    });

    it('should calculate sun path', async () => {
      const path = await calculateSunPath(testDate, locationOptions);
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBeGreaterThan(0);
      expect(path[0].azimuth).toBeDefined();
      expect(path[0].altitude).toBeDefined();
    });
  });

  describe('Moon Calculations', () => {
    it('should calculate moon times', async () => {
      const result = await calculateMoonData(testDate, locationOptions);

      expect(result).toBeDefined();
      // Moonrise/set can be null on some days, but the object should exist
      if (result.moonrise) expect(result.moonrise).toBeInstanceOf(Date);
      if (result.moonset) expect(result.moonset).toBeInstanceOf(Date);
    });

    it('should calculate moon phase', async () => {
      const phase = await calculateMoonPhase(testDate);
      expect(phase).toBeDefined();
      expect(typeof phase.phase).toBe('number');
      expect(typeof phase.illumination).toBe('number');
    });

    it('should calculate next moon phases', async () => {
      const phases = await calculateNextMoonPhases(testDate);
      expect(phases).toBeDefined();
      expect(phases.newMoon).toBeInstanceOf(Date);
      expect(phases.fullMoon).toBeInstanceOf(Date);
    });
  });

  describe('Planet Calculations', () => {
    it('should calculate rise/set for Jupiter', async () => {
      const result = await calculatePlanetRiseSetTimes(
        PlanetId.JUPITER,
        testDate,
        locationOptions
      );

      expect(result).toBeDefined();
      // Planet might not rise/set on a specific day, but result structure should hold
      if (result.rise) expect(result.rise).toBeInstanceOf(Date);
      if (result.set) expect(result.set).toBeInstanceOf(Date);
      if (result.transit) expect(result.transit).toBeInstanceOf(Date);
    });

    const planetsForRiseSetTest = [
      PlanetId.MERCURY,
      PlanetId.VENUS,
      PlanetId.MARS,
      PlanetId.JUPITER,
      PlanetId.SATURN,
      PlanetId.URANUS,
      PlanetId.NEPTUNE,
      PlanetId.PLUTO
    ];

    it.each(planetsForRiseSetTest)('should calculate rise/set for planet %s', async (planet) => {
      const result = await calculatePlanetRiseSetTimes(
          planet,
          testDate,
          locationOptions
      );
      expect(result).toBeDefined();
    });
    it('should include outer planets when requested', () => {
      // Use direct function for new features
      const planets = calculatePlanets(testDate, {
        includeOuterPlanets: true,
        location
      });

      expect(planets.some(p => p.name === 'Uranus')).toBe(true);
      expect(planets.some(p => p.name === 'Neptune')).toBe(true);
      expect(planets.some(p => p.name === 'Pluto')).toBe(true);
      expect(planets.length).toBeGreaterThan(9);
    });

    it('should exclude outer planets by default', () => {
      // Use direct function for new features
      const planets = calculatePlanets(testDate, {
        location
      });

      expect(planets.some(p => p.name === 'Uranus')).toBe(false);
      expect(planets.length).toBe(9); // 7 planets + Rahu + Ketu
    });
  });

  describe('Legacy API Compatibility', () => {
    it('should maintain backward compatibility with legacy calculator', async () => {
      // Import legacy functions for compatibility testing
      const { createSwephCalculator } = await import('./legacy');
      const calc = createSwephCalculator();

      expect(calc).toBeDefined();
      expect(typeof calc.calculateSunTimes).toBe('function');
      expect(typeof calc.calculatePlanetRiseSetTimes).toBe('function');

      // Test that legacy methods still work
      const sunTimes = await calc.calculateSunTimes(
        testDate,
        location.latitude,
        location.longitude,
        timeZoneOffset
      );
      expect(sunTimes).toBeDefined();
      expect(sunTimes.sunrise).toBeInstanceOf(Date);
    });
  });
});
