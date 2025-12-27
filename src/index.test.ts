import { describe, it, expect } from 'vitest';
import * as sweph from './index';

describe('@AstroFusion/sweph', () => {
  it('should export all main functions', () => {
    expect(typeof sweph.calculatePlanets).toBe('function');
    expect(typeof sweph.calculateLagna).toBe('function');
    expect(typeof sweph.calculateSunTimes).toBe('function');
    expect(typeof sweph.calculateMoonData).toBe('function');
  });

  it('should export constants', () => {
    expect(sweph.PLANETS).toBeDefined();
    expect(sweph.AYANAMSA).toBeDefined();
    expect(sweph.HOUSE_SYSTEMS).toBeDefined();
  });

  it('should have proper constants structure', () => {
    expect(sweph.PLANETS.SUN).toBeDefined();
    expect(sweph.PLANETS.MOON).toBeDefined();
    expect(sweph.PLANETS.SUN.name).toBe('Sun');
  });

  it('should export types', () => {
    // Type exports don't create runtime values, but we can test that the module loads
    expect(sweph).toBeDefined();
  });

  describe('Sun Calculations', () => {
    const testLocation = { latitude: 40.7128, longitude: -74.0060, timezone: -5 };
    const testDate = new Date('2024-03-15T12:00:00Z'); // Spring equinox

    it('calculateSunTimes should return complete sun times data', () => {
      const sunTimes = sweph.calculateSunTimes(testDate, testLocation);

      expect(sunTimes).toBeDefined();
      expect(sunTimes.sunrise).toBeInstanceOf(Date);
      expect(sunTimes.sunset).toBeInstanceOf(Date);
      expect(sunTimes.solarNoon).toBeInstanceOf(Date);
      expect(typeof sunTimes.dayLength).toBe('number');
      expect(sunTimes.dayLength).toBeGreaterThan(0);
      expect(sunTimes.dayLength).toBeLessThan(24);

      // Sunrise should be before solar noon, solar noon before sunset
      expect(sunTimes.sunrise!.getTime()).toBeLessThan(sunTimes.solarNoon.getTime());
      expect(sunTimes.solarNoon.getTime()).toBeLessThan(sunTimes.sunset!.getTime());

      // Civil twilight should exist
      expect(sunTimes.civilTwilightStart).toBeDefined();
      expect(sunTimes.civilTwilightEnd).toBeDefined();
    });

    it('calculateSolarNoon should return solar noon data', () => {
      const solarNoon = sweph.calculateSolarNoon(testDate, testLocation);

      expect(solarNoon).toBeDefined();
      expect(solarNoon.time).toBeInstanceOf(Date);
      expect(typeof solarNoon.altitude).toBe('number');
      expect(solarNoon.altitude).toBeGreaterThan(0);
      expect(solarNoon.altitude).toBeLessThan(90);
    });

    it('calculateSunPath should return hourly sun positions', () => {
      const sunPath = sweph.calculateSunPath(testDate, testLocation);

      expect(sunPath).toBeDefined();
      expect(Array.isArray(sunPath)).toBe(true);
      expect(sunPath.length).toBe(24); // 24 hours

      sunPath.forEach((position) => {
        expect(position).toHaveProperty('time');
        expect(position).toHaveProperty('azimuth');
        expect(position).toHaveProperty('altitude');
        expect(position.time).toBeInstanceOf(Date);
        expect(typeof position.azimuth).toBe('number');
        expect(typeof position.altitude).toBe('number');
        expect(position.azimuth).toBeGreaterThanOrEqual(0);
        expect(position.azimuth).toBeLessThanOrEqual(360);
        expect(position.altitude).toBeGreaterThanOrEqual(-90);
        expect(position.altitude).toBeLessThanOrEqual(90);
      });
    });
  });

  describe('Moon Calculations', () => {
    const testLocation = { latitude: 27.7172, longitude: 85.324, timezone: 5.75 };
    const testDate = new Date(); // Use current date for moon phases test

    it('calculateMoonData should return complete moon data', () => {
      const moonData = sweph.calculateMoonData(testDate, testLocation);

      expect(moonData).toBeDefined();
      expect(typeof moonData.illumination).toBe('number');
      expect(typeof moonData.age).toBe('number');
      expect(typeof moonData.phase).toBe('number');
      expect(typeof moonData.phaseName).toBe('string');
      expect(typeof moonData.distance).toBe('number');

      expect(moonData.illumination).toBeGreaterThanOrEqual(0);
      expect(moonData.illumination).toBeLessThanOrEqual(100);
      expect(moonData.age).toBeGreaterThanOrEqual(0);
      expect(moonData.age).toBeLessThanOrEqual(29.5);
      expect(moonData.phase).toBeGreaterThanOrEqual(0);
      expect(moonData.phase).toBeLessThanOrEqual(360);
      expect(moonData.distance).toBeGreaterThan(360000); // km, greater than Earth-Moon distance

      // Rise/set times might be null for some locations/dates
      if (moonData.moonrise) {
        expect(moonData.moonrise).toBeInstanceOf(Date);
      }
      if (moonData.moonset) {
        expect(moonData.moonset).toBeInstanceOf(Date);
      }
      if (moonData.transit) {
        expect(moonData.transit).toBeInstanceOf(Date);
      }
    });

    it('calculateMoonPhase should return phase information', () => {
      const phase = sweph.calculateMoonPhase(testDate);

      expect(phase).toBeDefined();
      expect(typeof phase.phase).toBe('number');
      expect(typeof phase.illumination).toBe('number');
      expect(typeof phase.age).toBe('number');
      expect(typeof phase.phaseName).toBe('string');

      expect(phase.phase).toBeGreaterThanOrEqual(0);
      expect(phase.phase).toBeLessThanOrEqual(360);
      expect(phase.illumination).toBeGreaterThanOrEqual(0);
      expect(phase.illumination).toBeLessThanOrEqual(100);
      expect(phase.age).toBeGreaterThanOrEqual(0);
      expect(phase.age).toBeLessThanOrEqual(29.5);
    });

    it('calculateNextMoonPhases should return upcoming moon phases', () => {
      const phases = sweph.calculateNextMoonPhases(testDate);

      expect(phases).toBeDefined();
      expect(phases.newMoon).toBeInstanceOf(Date);
      expect(phases.firstQuarter).toBeInstanceOf(Date);
      expect(phases.fullMoon).toBeInstanceOf(Date);
      expect(phases.lastQuarter).toBeInstanceOf(Date);

      // All phases should be in the future
      const now = new Date();
      expect(phases.newMoon.getTime()).toBeGreaterThan(now.getTime());
      expect(phases.firstQuarter.getTime()).toBeGreaterThan(now.getTime());
      expect(phases.fullMoon.getTime()).toBeGreaterThan(now.getTime());
      expect(phases.lastQuarter.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('Planet Calculations', () => {
    const testLocation = { latitude: 28.6139, longitude: 77.2090, timezone: 5.5 };
    const testDate = new Date('2024-03-15T12:00:00Z');

    it('calculatePlanets should return all 9 Vedic planets', () => {
      const planets = sweph.calculatePlanets(testDate, { location: testLocation });

      expect(planets).toBeDefined();
      expect(Array.isArray(planets)).toBe(true);
      expect(planets.length).toBe(9); // Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu

      planets.forEach((planet) => {
        expect(planet).toHaveProperty('id');
        expect(planet).toHaveProperty('name');
        expect(planet).toHaveProperty('longitude');
        expect(planet).toHaveProperty('latitude');
        expect(planet).toHaveProperty('distance');
        expect(planet).toHaveProperty('speed');
        expect(planet).toHaveProperty('rasi');
        expect(planet).toHaveProperty('rasiDegree');
        expect(planet).toHaveProperty('isRetrograde');
        expect(planet).toHaveProperty('totalDegree');

        expect(typeof planet.longitude).toBe('number');
        expect(typeof planet.latitude).toBe('number');
        expect(typeof planet.distance).toBe('number');
        expect(typeof planet.speed).toBe('number');
        expect(typeof planet.rasi).toBe('number');
        expect(typeof planet.rasiDegree).toBe('number');
        expect(typeof planet.isRetrograde).toBe('boolean');
        expect(typeof planet.totalDegree).toBe('number');

        expect(planet.longitude).toBeGreaterThanOrEqual(0);
        expect(planet.longitude).toBeLessThanOrEqual(360);
        expect(planet.rasi).toBeGreaterThanOrEqual(1);
        expect(planet.rasi).toBeLessThanOrEqual(12);
        expect(planet.rasiDegree).toBeGreaterThanOrEqual(0);
        expect(planet.rasiDegree).toBeLessThanOrEqual(30);
      });

      // Check specific planets
      const sun = planets.find(p => p.name === 'Sun');
      const moon = planets.find(p => p.name === 'Moon');
      const mars = planets.find(p => p.name === 'Mars');

      expect(sun).toBeDefined();
      expect(moon).toBeDefined();
      expect(mars).toBeDefined();
    });

    it('calculateSinglePlanet should return individual planet data', () => {
      const sun = sweph.calculateSinglePlanet(sweph.PLANETS.SUN.id, testDate, { location: testLocation });

      expect(sun).toBeDefined();
      expect(typeof sun!.name).toBe('string');
      expect(sun!.name).toBe('Sun');
      expect(typeof sun!.longitude).toBe('number');
      expect(typeof sun!.latitude).toBe('number');
      expect(typeof sun!.distance).toBe('number');
      expect(typeof sun!.speed).toBe('number');
      expect(sun!.longitude).toBeGreaterThanOrEqual(0);
      expect(sun!.longitude).toBeLessThanOrEqual(360);
    });

    it('calculatePlanetRiseSetTimes should return rise/set/transit times', () => {
      const sunTimes = sweph.calculatePlanetRiseSetTimes(sweph.PLANETS.SUN.id, testDate, testLocation);

      expect(sunTimes).toBeDefined();
      expect(typeof sunTimes.rise).toBe('object'); // Could be Date or null
      expect(typeof sunTimes.set).toBe('object'); // Could be Date or null
      expect(typeof sunTimes.transit).toBe('object'); // Could be Date or null
      expect(typeof sunTimes.transitAltitude).toBe('number');
      expect(typeof sunTimes.transitDistance).toBe('number');

      if (sunTimes.rise) {
        expect(sunTimes.rise).toBeInstanceOf(Date);
      }
      if (sunTimes.set) {
        expect(sunTimes.set).toBeInstanceOf(Date);
      }
      if (sunTimes.transit) {
        expect(sunTimes.transit).toBeInstanceOf(Date);
      }

      expect(sunTimes.transitAltitude).toBeGreaterThanOrEqual(0);
      expect(sunTimes.transitAltitude).toBeLessThanOrEqual(90);
      expect(sunTimes.transitDistance).toBeGreaterThanOrEqual(0);
    });

    it('calculatePlanetRiseSetTimes should work for different planets', () => {
      const planetsToTest = [
        sweph.PLANETS.SUN.id,
        sweph.PLANETS.MOON.id,
        sweph.PLANETS.MARS.id,
        sweph.PLANETS.VENUS.id
      ];

      planetsToTest.forEach((planetId) => {
        const times = sweph.calculatePlanetRiseSetTimes(planetId, testDate, testLocation);
        expect(times).toBeDefined();
        expect(typeof times.transitAltitude).toBe('number');
        expect(typeof times.transitDistance).toBe('number');
      });
    });
  });

  describe('Integration Tests', () => {
    const testLocation = { latitude: 40.7128, longitude: -74.0060, timezone: -5 };
    const testDate = new Date('2024-03-15T12:00:00Z'); // Spring equinox

    it('sun and moon calculations should be consistent', () => {
      const sunTimes = sweph.calculateSunTimes(testDate, testLocation);
      const moonData = sweph.calculateMoonData(testDate, testLocation);

      // Both should return valid data
      expect(sunTimes.sunrise).toBeDefined();
      expect(moonData.illumination).toBeDefined();

      // Solar day should be reasonable length (around 12 hours at equinox)
      expect(sunTimes.dayLength).toBeGreaterThan(11);
      expect(sunTimes.dayLength).toBeLessThan(13);
    });

    it('planet positions should be within valid ranges', () => {
      const planets = sweph.calculatePlanets(testDate);

      planets.forEach((planet) => {
        // Longitude should be 0-360
        expect(planet.longitude).toBeGreaterThanOrEqual(0);
        expect(planet.longitude).toBeLessThanOrEqual(360);

        // Rasi should be 1-12
        expect(planet.rasi).toBeGreaterThanOrEqual(1);
        expect(planet.rasi).toBeLessThanOrEqual(12);

        // Rasi degree should be 0-30
        expect(planet.rasiDegree).toBeGreaterThanOrEqual(0);
        expect(planet.rasiDegree).toBeLessThanOrEqual(30);
      });
    });
  });
});
