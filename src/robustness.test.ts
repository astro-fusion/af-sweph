import { describe, it, expect } from 'vitest';
import { 
  createSwephCalculator, 
  PlanetId,
  PlanetaryCalculationProvider
} from './index';

describe('SWEPH Robustness Tests', () => {
  let calculator: PlanetaryCalculationProvider;
  const testDate = new Date('2025-01-01T12:00:00Z');
  // Kathmandu, Nepal
  const location = {
    latitude: 27.7172,
    longitude: 85.3240,
    height: 1400
  };
  const timeZoneOffset = 5.75; // UTC+5:45

  // Ensure calculator is initialized before running tests
  const getCalculator = async () => {
    if (!calculator) {
      calculator = await createSwephCalculator();
    }
    return calculator;
  };

  it('should initialize calculator successfully', async () => {
    const calc = await getCalculator();
    expect(calc).toBeDefined();
  });

  describe('Sun Calculations', () => {
    it('should calculate sun times without error', async () => {
      const calc = await getCalculator();
      const result = await calc.calculateSunTimes(
        testDate,
        location.latitude,
        location.longitude,
        timeZoneOffset
      );

      expect(result).toBeDefined();
      expect(result.sunrise).toBeInstanceOf(Date);
      expect(result.sunset).toBeInstanceOf(Date);
      expect(result.solarNoon).toBeInstanceOf(Date);
      expect(typeof result.dayLength).toBe('number');
      expect(result.dayLength).toBeGreaterThan(0);
    });

    it('should calculate sun path', async () => {
      const calc = await getCalculator();
      const path = await calc.calculateDailySunPath(
        testDate,
        location.latitude,
        location.longitude,
        timeZoneOffset
      );
      expect(Array.isArray(path)).toBe(true);
      expect(path.length).toBeGreaterThan(0);
      expect(path[0].azimuth).toBeDefined();
      expect(path[0].altitude).toBeDefined();
    });
  });

  describe('Moon Calculations', () => {
    it('should calculate moon times', async () => {
      const calc = await getCalculator();
      const result = await calc.calculateMoonTimes(
        testDate,
        location.latitude,
        location.longitude,
        timeZoneOffset
      );
      
      expect(result).toBeDefined();
      // Moonrise/set can be null on some days, but the object should exist
      if (result.moonrise) expect(result.moonrise).toBeInstanceOf(Date);
      if (result.moonset) expect(result.moonset).toBeInstanceOf(Date);
    });

    it('should calculate moon phase', async () => {
      const calc = await getCalculator();
      const phase = await calc.calculateMoonPhase(testDate);
      expect(phase).toBeDefined();
      expect(typeof phase.phase).toBe('number');
      expect(typeof phase.illumination).toBe('number');
    });

    it('should calculate next moon phases', async () => {
      const calc = await getCalculator();
      const phases = await calc.calculateNextMoonPhases(testDate);
      expect(phases).toBeDefined();
      expect(phases.newMoon).toBeInstanceOf(Date);
      expect(phases.fullMoon).toBeInstanceOf(Date);
    });
  });

  describe('Planet Calculations', () => {
    it('should calculate rise/set for Jupiter', async () => {
      const calc = await getCalculator();
      const result = await calc.calculatePlanetRiseSetTimes(
        PlanetId.JUPITER,
        testDate,
        location.latitude,
        location.longitude,
        timeZoneOffset
      );

      expect(result).toBeDefined();
      // Planet might not rise/set on a specific day, but result structure should hold
      if (result.rise) expect(result.rise).toBeInstanceOf(Date);
      if (result.set) expect(result.set).toBeInstanceOf(Date);
      if (result.transit) expect(result.transit).toBeInstanceOf(Date);
    });

    it('should calculate rise/set for all planets', async () => {
      const calc = await getCalculator();
      const planets = [
        PlanetId.MERCURY, 
        PlanetId.VENUS, 
        PlanetId.MARS, 
        PlanetId.JUPITER, 
        PlanetId.SATURN,
        PlanetId.URANUS,
        PlanetId.NEPTUNE,
        PlanetId.PLUTO
      ];

      for (const planet of planets) {
        const result = await calc.calculatePlanetRiseSetTimes(
            planet,
            testDate,
            location.latitude,
            location.longitude,
            timeZoneOffset
        );
        expect(result).toBeDefined();
      }
    });
  });
});
